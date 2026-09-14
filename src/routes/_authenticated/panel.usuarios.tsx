import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { KeyRound, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { PanelHeader } from "@/components/panel/PanelLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/hooks/useAuth";
import {
  createAccount,
  listAccounts,
  purgeDemoData,
  resetAccountPassword,
  setUserRoles,
} from "@/lib/admin.functions";
import { ROLE_LABELS, formatDateTime, type AppRole } from "@/lib/domain";

export const Route = createFileRoute("/_authenticated/panel/usuarios")({
  component: UsersPage,
});

const ALL_ROLES: AppRole[] = ["admin", "teacher", "student", "guardian"];

function UsersPage() {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
    fullName: "",
    roles: ["student"] as AppRole[],
  });
  const [resetTarget, setResetTarget] = useState<{ id: string; email: string } | null>(null);
  const [newPassword, setNewPassword] = useState("");

  const accounts = useQuery({
    queryKey: ["accounts"],
    enabled: auth.isAdmin,
    queryFn: () => listAccounts(),
  });

  const create = useMutation({
    mutationFn: () => createAccount({ data: form }),
    onSuccess: async () => {
      toast.success("Cuenta creada");
      setOpen(false);
      setForm({ email: "", password: "", fullName: "", roles: ["student"] });
      await queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateRoles = useMutation({
    mutationFn: (input: { userId: string; roles: AppRole[] }) => setUserRoles({ data: input }),
    onSuccess: async () => {
      toast.success("Roles actualizados");
      await queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const resetPassword = useMutation({
    mutationFn: () =>
      resetAccountPassword({ data: { userId: resetTarget!.id, password: newPassword } }),
    onSuccess: () => {
      toast.success("Contraseña restablecida");
      setResetTarget(null);
      setNewPassword("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const purge = useMutation({
    mutationFn: () => purgeDemoData(),
    onSuccess: async () => {
      toast.success("Datos de demostración eliminados");
      await queryClient.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!auth.isAdmin) {
    return <p className="text-sm text-muted-foreground">Esta sección es solo para administradores.</p>;
  }

  return (
    <>
      <PanelHeader
        title="Cuentas de acceso"
        description="Cree cuentas y asigne los roles que definen lo que cada persona puede ver."
        action={
          <Button onClick={() => setOpen(true)}>
            <Plus className="size-4" /> Nueva cuenta
          </Button>
        }
      />

      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Persona</TableHead>
              <TableHead>Roles</TableHead>
              <TableHead className="hidden md:table-cell">Último ingreso</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {accounts.isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-sm text-muted-foreground">
                  Cargando cuentas…
                </TableCell>
              </TableRow>
            ) : (
              (accounts.data ?? []).map((account) => (
                <TableRow key={account.id}>
                  <TableCell>
                    <p className="font-medium">{account.fullName || "Sin nombre"}</p>
                    <p className="text-xs text-muted-foreground">{account.email}</p>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1.5">
                      {ALL_ROLES.map((role) => {
                        const has = account.roles.includes(role);
                        return (
                          <button
                            key={role}
                            type="button"
                            onClick={() =>
                              updateRoles.mutate({
                                userId: account.id,
                                roles: has
                                  ? (account.roles.filter((r) => r !== role) as AppRole[])
                                  : ([...account.roles, role] as AppRole[]),
                              })
                            }
                          >
                            <Badge variant={has ? "default" : "outline"} className="cursor-pointer">
                              {ROLE_LABELS[role]}
                            </Badge>
                          </button>
                        );
                      })}
                    </div>
                  </TableCell>
                  <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                    {account.lastSignInAt ? formatDateTime(account.lastSignInAt) : "Nunca"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setResetTarget({ id: account.id, email: account.email })}
                    >
                      <KeyRound className="size-4" /> Contraseña
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Card className="mt-8 border-destructive/40">
        <CardHeader>
          <CardTitle className="font-display text-base">Datos de demostración</CardTitle>
          <CardDescription>
            Elimina de forma definitiva todos los registros creados como ejemplo (marcados como
            demo). Los datos reales que usted haya creado no se tocan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            onClick={() => {
              if (window.confirm("¿Eliminar todos los datos de demostración?")) purge.mutate();
            }}
            disabled={purge.isPending}
          >
            <Trash2 className="size-4" />
            {purge.isPending ? "Eliminando…" : "Eliminar datos de demostración"}
          </Button>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nueva cuenta de acceso</DialogTitle>
            <DialogDescription>
              Si el correo coincide con un estudiante, docente o acudiente registrado, los datos se
              vinculan automáticamente.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="uname">Nombre completo</Label>
              <Input
                id="uname"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="uemail">Correo</Label>
              <Input
                id="uemail"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="upass">Contraseña temporal</Label>
              <Input
                id="upass"
                type="text"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Roles</Label>
              <div className="space-y-2">
                {ALL_ROLES.map((role) => (
                  <label key={role} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={form.roles.includes(role)}
                      onCheckedChange={(checked) =>
                        setForm({
                          ...form,
                          roles: checked
                            ? [...form.roles, role]
                            : form.roles.filter((r) => r !== role),
                        })
                      }
                    />
                    {ROLE_LABELS[role]}
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => create.mutate()}
              disabled={
                form.fullName.trim().length < 3 ||
                !form.email.includes("@") ||
                form.password.length < 8 ||
                form.roles.length === 0 ||
                create.isPending
              }
            >
              {create.isPending ? "Creando…" : "Crear cuenta"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(resetTarget)} onOpenChange={(v) => !v && setResetTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Restablecer contraseña</DialogTitle>
            <DialogDescription>{resetTarget?.email}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="npass">Nueva contraseña</Label>
            <Input
              id="npass"
              type="text"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetTarget(null)}>
              Cancelar
            </Button>
            <Button
              onClick={() => resetPassword.mutate()}
              disabled={newPassword.length < 8 || resetPassword.isPending}
            >
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
