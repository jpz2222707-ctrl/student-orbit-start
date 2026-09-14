import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { PanelHeader } from "@/components/panel/PanelLayout";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { formatDateTime } from "@/lib/domain";

export const Route = createFileRoute("/_authenticated/panel/auditoria")({
  component: AuditPage,
});

const ACTION_LABELS: Record<string, string> = {
  INSERT: "Creación",
  UPDATE: "Modificación",
  DELETE: "Eliminación",
  CREATE_ACCOUNT: "Cuenta creada",
  RESET_PASSWORD: "Contraseña restablecida",
  PURGE_DEMO_DATA: "Limpieza de datos demo",
};

function AuditPage() {
  const auth = useAuth();

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["audit_log"],
    enabled: auth.isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_log")
        .select("id, user_email, action, entity, entity_id, created_at")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });

  if (!auth.isAdmin) {
    return <p className="text-sm text-muted-foreground">Esta sección es solo para administradores.</p>;
  }

  return (
    <>
      <PanelHeader
        title="Auditoría"
        description="Registro de los últimos 200 cambios sobre información sensible."
      />
      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Usuario</TableHead>
              <TableHead>Acción</TableHead>
              <TableHead>Registro</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-sm text-muted-foreground">
                  Cargando…
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-sm text-muted-foreground">
                  Todavía no hay movimientos registrados.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDateTime(row.created_at)}
                  </TableCell>
                  <TableCell className="text-sm">{row.user_email ?? "sistema"}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{ACTION_LABELS[row.action] ?? row.action}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {row.entity}
                    {row.entity_id ? ` · ${row.entity_id.slice(0, 8)}` : ""}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
