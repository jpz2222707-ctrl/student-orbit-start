import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { BookMarked, ClipboardList, GraduationCap, Users } from "lucide-react";

import { PanelHeader } from "@/components/panel/PanelLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { PERIOD_STATUS_LABELS, ROLE_LABELS, formatDate, fullName } from "@/lib/domain";
import { useActiveYear, usePeriods } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/panel/")({
  component: DashboardPage,
});

function useAdminStats(enabled: boolean) {
  return useQuery({
    queryKey: ["admin-stats"],
    enabled,
    queryFn: async () => {
      const count = async (table: "students" | "teachers" | "courses" | "subjects") => {
        const { count: c, error } = await supabase
          .from(table)
          .select("id", { count: "exact", head: true });
        if (error) throw error;
        return c ?? 0;
      };
      const [students, teachers, courses, subjects] = await Promise.all([
        count("students"),
        count("teachers"),
        count("courses"),
        count("subjects"),
      ]);
      return { students, teachers, courses, subjects };
    },
  });
}

function useTeacherAssignments(enabled: boolean) {
  return useQuery({
    queryKey: ["my-assignments"],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("course_subjects")
        .select("id, courses(code, name), subjects(name)")
        .order("id");
      if (error) throw error;
      return data ?? [];
    },
  });
}

function useMyStudent(enabled: boolean) {
  return useQuery({
    queryKey: ["my-student"],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select("id, first_name, last_name, document_number, status")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

function DashboardPage() {
  const auth = useAuth();
  const year = useActiveYear();
  const { data: periods = [] } = usePeriods(year?.id);
  const stats = useAdminStats(auth.isAdmin);
  const assignments = useTeacherAssignments(auth.isTeacher && !auth.isAdmin);
  const student = useMyStudent(auth.isStudent || auth.isGuardian);
  const activePeriod = periods.find((p) => p.status === "activo");

  return (
    <>
      <PanelHeader
        title={`Hola, ${auth.fullName.split(" ")[0] || "bienvenido"}`}
        description={`${auth.primaryRole ? ROLE_LABELS[auth.primaryRole] : "Usuario"} · Año escolar ${
          year?.name ?? "sin definir"
        }`}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Período actual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-display text-xl">{activePeriod?.name ?? "Sin período activo"}</p>
            {activePeriod ? (
              <p className="mt-1 text-xs text-muted-foreground">
                {formatDate(activePeriod.start_date)} — {formatDate(activePeriod.end_date)}
              </p>
            ) : null}
          </CardContent>
        </Card>

        {auth.isAdmin ? (
          <>
            <StatCard label="Estudiantes" value={stats.data?.students} icon={Users} />
            <StatCard label="Docentes" value={stats.data?.teachers} icon={GraduationCap} />
            <StatCard label="Cursos" value={stats.data?.courses} icon={BookMarked} />
          </>
        ) : null}

        {auth.isTeacher && !auth.isAdmin ? (
          <StatCard
            label="Materias asignadas"
            value={assignments.data?.length}
            icon={ClipboardList}
          />
        ) : null}
      </div>

      {auth.isAdmin ? (
        <section className="mt-8">
          <h2 className="text-lg">Accesos rápidos</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button asChild variant="secondary">
              <Link to="/panel/estudiantes">Gestionar estudiantes</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link to="/panel/cursos">Cursos y matrículas</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link to="/panel/calificaciones">Calificaciones</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link to="/panel/usuarios">Cuentas de acceso</Link>
            </Button>
          </div>
        </section>
      ) : null}

      {auth.isTeacher && !auth.isAdmin ? (
        <section className="mt-8">
          <h2 className="text-lg">Mis materias</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(assignments.data ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aún no tiene materias asignadas. Solicite la asignación a la coordinación académica.
              </p>
            ) : (
              (assignments.data ?? []).map((row) => (
                <Card key={row.id}>
                  <CardContent className="pt-6">
                    <p className="font-display text-base">{row.subjects?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {row.courses?.code} · {row.courses?.name}
                    </p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
          <Button asChild className="mt-4">
            <Link to="/panel/calificaciones">Registrar calificaciones</Link>
          </Button>
        </section>
      ) : null}

      {(auth.isStudent || auth.isGuardian) && student.data ? (
        <section className="mt-8">
          <h2 className="text-lg">{auth.isGuardian ? "Estudiante a cargo" : "Mis datos"}</h2>
          <Card className="mt-4 max-w-md">
            <CardContent className="pt-6">
              <p className="font-display text-lg">{fullName(student.data)}</p>
              <p className="text-sm text-muted-foreground">
                Documento {student.data.document_number}
              </p>
              <Badge className="mt-3" variant="secondary">
                {student.data.status}
              </Badge>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button asChild size="sm">
                  <Link to="/panel/mis-notas">Ver notas</Link>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <Link to="/panel/boletines">Boletines</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      ) : null}

      <section className="mt-8">
        <h2 className="text-lg">Períodos del año</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {periods.map((p) => (
            <Card key={p.id}>
              <CardContent className="pt-6">
                <p className="font-display text-base">{p.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(p.start_date)} — {formatDate(p.end_date)}
                </p>
                <Badge variant={p.status === "activo" ? "default" : "secondary"} className="mt-2">
                  {PERIOD_STATUS_LABELS[p.status as keyof typeof PERIOD_STATUS_LABELS]}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number | undefined;
  icon: typeof Users;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Icon className="size-4" /> {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="font-display text-3xl">{value ?? "—"}</p>
      </CardContent>
    </Card>
  );
}
