import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

const ROLES = ["admin", "teacher", "student", "guardian"] as const;

const createAccountSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(72),
  fullName: z.string().min(3).max(120),
  roles: z.array(z.enum(ROLES)).min(1),
});

const setRolesSchema = z.object({
  userId: z.string().uuid(),
  roles: z.array(z.enum(ROLES)),
});

/**
 * Verifica en el servidor que quien llama tenga rol de administrador.
 * La consulta se hace con el cliente del usuario, así que las reglas de la
 * base de datos también aplican.
 */
async function assertAdmin(context: {
  supabase: SupabaseClient<Database>;
  userId: string;
}): Promise<void> {
  const { data, error } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error || !data) throw new Error("Acción permitida solo a administradores");
}

/** Crea una cuenta de acceso y le asigna roles. Solo administradores. */
export const createAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => createAccountSchema.parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.fullName },
    });
    if (error || !created.user) {
      throw new Error(error?.message ?? "No fue posible crear la cuenta");
    }

    const rows = data.roles.map((role) => ({ user_id: created.user!.id, role }));
    const { error: roleError } = await supabaseAdmin.from("user_roles").upsert(rows, {
      onConflict: "user_id,role",
    });
    if (roleError) throw new Error(roleError.message);

    await supabaseAdmin
      .from("profiles")
      .upsert(
        { id: created.user.id, full_name: data.fullName, email: data.email },
        { onConflict: "id" },
      );

    await supabaseAdmin.from("audit_log").insert({
      user_id: context.userId,
      action: "CREATE_ACCOUNT",
      entity: "auth.users",
      entity_id: created.user.id,
      details: { email: data.email, roles: data.roles },
    });

    return { userId: created.user.id };
  });

/** Reemplaza los roles de un usuario. Solo administradores. */
export const setUserRoles = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => setRolesSchema.parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    if (data.userId === context.userId && !data.roles.includes("admin")) {
      throw new Error("No puede quitarse a sí mismo el rol de administrador");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    await supabaseAdmin.from("user_roles").delete().eq("user_id", data.userId);
    if (data.roles.length > 0) {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .insert(data.roles.map((role) => ({ user_id: data.userId, role })));
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

/** Lista las cuentas de acceso con sus roles. Solo administradores. */
export const listAccounts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: users, error } = await supabaseAdmin.auth.admin.listUsers({ perPage: 500 });
    if (error) throw new Error(error.message);
    const { data: roles } = await supabaseAdmin.from("user_roles").select("user_id, role");
    const { data: profiles } = await supabaseAdmin.from("profiles").select("id, full_name");

    return users.users.map((u) => ({
      id: u.id,
      email: u.email ?? "",
      createdAt: u.created_at,
      lastSignInAt: u.last_sign_in_at ?? null,
      fullName: profiles?.find((p) => p.id === u.id)?.full_name ?? "",
      roles: (roles ?? []).filter((r) => r.user_id === u.id).map((r) => r.role as string),
    }));
  });

/** Restablece la contraseña de una cuenta. Solo administradores. */
export const resetAccountPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ userId: z.string().uuid(), password: z.string().min(8).max(72) }).parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, {
      password: data.password,
    });
    if (error) throw new Error(error.message);
    await supabaseAdmin.from("audit_log").insert({
      user_id: context.userId,
      action: "RESET_PASSWORD",
      entity: "auth.users",
      entity_id: data.userId,
    });
    return { ok: true };
  });

/** Elimina todos los registros marcados como datos de demostración. Solo administradores. */
export const purgeDemoData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // El orden respeta las dependencias entre tablas.
    const tables = [
      "grade_items",
      "enrollments",
      "course_subjects",
      "courses",
      "academic_periods",
      "academic_years",
      "students",
      "teachers",
      "guardians",
      "subjects",
      "grade_levels",
      "news",
      "events",
    ] as const;

    for (const table of tables) {
      const { error } = await supabaseAdmin.from(table).delete().eq("is_demo", true);
      if (error) throw new Error(`No se pudo limpiar ${table}: ${error.message}`);
    }

    await supabaseAdmin.from("audit_log").insert({
      user_id: context.userId,
      action: "PURGE_DEMO_DATA",
      entity: "system",
    });

    return { ok: true };
  });

/**
 * Crea las cuentas de prueba iniciales (administrador, docente, estudiante y acudiente).
 * Es pública a propósito para poder entrar la primera vez, pero se bloquea
 * en cuanto exista al menos un administrador en el sistema.
 */
export const bootstrapDemoAccounts = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { count, error: countError } = await supabaseAdmin
    .from("user_roles")
    .select("id", { count: "exact", head: true })
    .eq("role", "admin");
  if (countError) throw new Error(countError.message);
  if ((count ?? 0) > 0) {
    throw new Error("Ya existe un administrador. Las cuentas se crean desde el panel.");
  }

  const password = "Demo2026*";
  const accounts: { email: string; fullName: string; roles: (typeof ROLES)[number][] }[] = [
    { email: "admin@demo.edu.co", fullName: "Administrador Demo", roles: ["admin"] },
    { email: "docente@demo.edu.co", fullName: "Carolina Restrepo Díaz", roles: ["teacher"] },
    { email: "estudiante@demo.edu.co", fullName: "Juan David Pérez Ramírez", roles: ["student"] },
    { email: "acudiente@demo.edu.co", fullName: "Marta Ramírez Duque", roles: ["guardian"] },
  ];

  for (const account of accounts) {
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: account.email,
      password,
      email_confirm: true,
      user_metadata: { full_name: account.fullName },
    });
    if (error || !created.user) continue;
    await supabaseAdmin
      .from("user_roles")
      .upsert(
        account.roles.map((role) => ({ user_id: created.user!.id, role })),
        { onConflict: "user_id,role" },
      );
  }

  return { password, emails: accounts.map((a) => a.email) };
});
