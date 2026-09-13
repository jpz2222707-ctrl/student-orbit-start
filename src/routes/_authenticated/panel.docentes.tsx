import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Pencil, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { PanelHeader } from "@/components/panel/PanelLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  DOCUMENT_TYPES,
  DOCUMENT_TYPE_LABELS,
  PERSON_STATUS_LABELS,
  type DocumentType,
  type PersonStatus,
} from "@/lib/domain";

export const Route = createFileRoute("/_authenticated/panel/docentes")({
  component: TeachersPage,
});

type TeacherRow = {
  id: string;
  document_type: DocumentType;
  document_number: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  status: PersonStatus;
  is_demo: boolean;
};

const EMPTY = {
  document_type: "CC" as DocumentType,
  document_number: "",
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  status: "activo" as PersonStatus,
};

function TeachersPage() {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<TeacherRow | null>(null);
  const [form, setForm] = useState({ ...EMPTY });

  const { data: teachers = [], isLoading } = useQuery({
    queryKey: ["teachers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("teachers").select("*").order("last_name");
      if (error) throw error;
      return (data ?? []) as TeacherRow[];
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        document_type: form.document_type,
        document_number: form.document_number.trim(),
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        status: form.status,
      };
      if (editing) {
        const { error } = await supabase.from("teachers").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("teachers").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: async () => {
      toast.success(editing ? "Docente actualizado" : "Docente creado");
      setOpen(false);
      setEditing(null);
      setForm({ ...EMPTY });
      await queryClient.invalidateQueries({ queryKey: ["teachers"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (!auth.isAdmin) {
    return <p className="text-sm text-muted-foreground">Esta sección es solo para administradores.</p>;
  }

  const canSave =
    form.first_name.trim().length >= 2 &&
    form.last_name.trim().length >= 2 &&
    form.document_number.trim().length >= 4;

  return (
    <>
      <PanelHeader
        title="Docentes"
        description={`${teachers.length} docentes registrados`}
        action={
          <Button
            onClick={() => {
              setEditing(null);
              setForm({ ...EMPTY });
              setOpen(true);
            }}
          >
            <Plus className="size-4" /> Nuevo docente
          </Button>
        }
      />

      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Documento</TableHead>
              <TableHead className="hidden md:table-cell">Correo</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-sm text-muted-foreground">
                  Cargando…
                </TableCell>
              </TableRow>
            ) : teachers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-sm text-muted-foreground">
                  Aún no hay docentes registrados.
                </TableCell>
              </TableRow>
            ) : (
              teachers.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">
                    {row.last_name}, {row.first_name}
                    {row.is_demo ? (
                      <Badge variant="outline" className="ml-2 text-xs">
                        demo
                      </Badge>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {row.document_type} {row.document_number}
                  </TableCell>
                  <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                    {row.email ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={row.status === "activo" ? "default" : "secondary"}>
                      {PERSON_STATUS_LABELS[row.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditing(row);
                        setForm({
                          document_type: row.document_type,
                          document_number: row.document_number,
                          first_name: row.first_name,
                          last_name: row.last_name,
                          email: row.email ?? "",
                          phone: row.phone ?? "",
                          status: row.status,
                        });
                        setOpen(true);
                      }}
                    >
                      <Pencil className="size-4" /> Editar
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar docente" : "Nuevo docente"}</DialogTitle>
            <DialogDescription>
              El correo debe coincidir con el de su cuenta de acceso para vincular ambos registros.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Tipo de documento</Label>
              <Select
                value={form.document_type}
                onValueChange={(v) => setForm({ ...form, document_type: v as DocumentType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {DOCUMENT_TYPE_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tdoc">Número de documento</Label>
              <Input
                id="tdoc"
                value={form.document_number}
                onChange={(e) => setForm({ ...form, document_number: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tnombres">Nombres</Label>
              <Input
                id="tnombres"
                value={form.first_name}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tapellidos">Apellidos</Label>
              <Input
                id="tapellidos"
                value={form.last_name}
                onChange={(e) => setForm({ ...form, last_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tcorreo">Correo</Label>
              <Input
                id="tcorreo"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ttel">Teléfono</Label>
              <Input
                id="ttel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select
                value={form.status}
                onValueChange={(v) => setForm({ ...form, status: v as PersonStatus })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="activo">Activo</SelectItem>
                  <SelectItem value="inactivo">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => save.mutate()} disabled={!canSave || save.isPending}>
              {save.isPending ? "Guardando…" : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
