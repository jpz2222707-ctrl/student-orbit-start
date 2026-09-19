import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Pencil, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { PanelHeader } from "@/components/panel/PanelLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { PERIOD_STATUS_LABELS, formatDate, type PeriodStatus } from "@/lib/domain";
import { useAcademicYears, usePeriods } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/panel/periodos")({
  component: PeriodsPage,
});

type PeriodForm = {
  name: string;
  order_index: string;
  start_date: string;
  end_date: string;
  status: PeriodStatus;
};

const emptyForm: PeriodForm = {
  name: "",
  order_index: "",
  start_date: "",
  end_date: "",
  status: "proximo",
};

/** Validaciones compartidas por la creación y la edición de períodos. */
function validate(form: PeriodForm): string | null {
  if (form.name.trim().length < 3) return "El nombre del período es demasiado corto";
  const order = Number(form.order_index);
  if (!Number.isInteger(order) || order < 1) return "El orden debe ser un número entero mayor a cero";
  if (!form.start_date || !form.end_date) return "Indique la fecha de inicio y de finalización";
  if (new Date(form.end_date) < new Date(form.start_date)) {
    return "La fecha de finalización no puede ser anterior al inicio";
  }
  return null;
}

function PeriodsPage() {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const { data: years = [] } = useAcademicYears();
  const [yearId, setYearId] = useState("");
  const selectedYear = yearId || years.find((y) => y.is_active)?.id || years[0]?.id || "";
  const { data: periods = [] } = usePeriods(selectedYear || null);

  const [form, setForm] = useState<PeriodForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<PeriodForm>(emptyForm);

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["academic_periods"] });
  };

  const create = useMutation({
    mutationFn: async () => {
      const problem = validate(form);
      if (problem) throw new Error(problem);
      const { error } = await supabase.from("academic_periods").insert({
        academic_year_id: selectedYear,
        name: form.name.trim(),
        order_index: Number(form.order_index),
        start_date: form.start_date,
        end_date: form.end_date,
        status: form.status,
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Período creado");
      setForm(emptyForm);
      await refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const update = useMutation({
    mutationFn: async () => {
      const problem = validate(editForm);
      if (problem) throw new Error(problem);
      const { error } = await supabase
        .from("academic_periods")
        .update({
          name: editForm.name.trim(),
          order_index: Number(editForm.order_index),
          start_date: editForm.start_date,
          end_date: editForm.end_date,
          status: editForm.status,
        })
        .eq("id", editingId!);
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Período actualizado");
      setEditingId(null);
      await refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const changeStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: PeriodStatus }) => {
      const { error } = await supabase.from("academic_periods").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: async (_d, vars) => {
      toast.success(
        vars.status === "activo"
          ? "Período activado. Los demás períodos del año quedaron cerrados."
          : "Estado del período actualizado",
      );
      await refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("academic_periods").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Período eliminado");
      await refresh();
    },
    onError: (e: Error) =>
      toast.error(
        e.message.includes("información académica")
          ? "El período tiene notas o boletines asociados: ciérrelo en lugar de eliminarlo."
          : e.message,
      ),
  });

  const { data: usage = {} } = useQuery({
    queryKey: ["period-usage", selectedYear],
    enabled: periods.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("grade_items")
        .select("period_id")
        .in(
          "period_id",
          periods.map((p) => p.id),
        );
      if (error) throw error;
      const counts: Record<string, number> = {};
      for (const row of data ?? []) counts[row.period_id] = (counts[row.period_id] ?? 0) + 1;
      return counts;
    },
  });

  if (!auth.isAdmin) {
    return (
      <p className="text-sm text-muted-foreground">Esta sección es solo para administradores.</p>
    );
  }

  const startEdit = (p: (typeof periods)[number]) => {
    setEditingId(p.id);
    setEditForm({
      name: p.name,
      order_index: String(p.order_index),
      start_date: p.start_date,
      end_date: p.end_date,
      status: p.status as PeriodStatus,
    });
  };

  return (
    <>
      <PanelHeader
        title="Períodos académicos"
        description="Defina los períodos del año escolar. Solo un período puede estar activo a la vez y los docentes únicamente registran notas en el período activo."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg">Períodos del año</CardTitle>
            <CardDescription>
              Los períodos con notas registradas no se eliminan: se cierran para conservar el
              historial.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="max-w-xs space-y-2">
              <Label>Año escolar</Label>
              <Select value={selectedYear} onValueChange={setYearId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione un año" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((y) => (
                    <SelectItem key={y.id} value={y.id}>
                      {y.name} {y.is_active ? "(activo)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              {periods.map((p) =>
                editingId === p.id ? (
                  <div key={p.id} className="space-y-3 rounded-md border border-primary/40 p-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Nombre</Label>
                        <Input
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Orden</Label>
                        <Input
                          type="number"
                          min={1}
                          value={editForm.order_index}
                          onChange={(e) =>
                            setEditForm({ ...editForm, order_index: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Inicio</Label>
                        <Input
                          type="date"
                          value={editForm.start_date}
                          onChange={(e) => setEditForm({ ...editForm, start_date: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Fin</Label>
                        <Input
                          type="date"
                          value={editForm.end_date}
                          onChange={(e) => setEditForm({ ...editForm, end_date: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Estado</Label>
                        <Select
                          value={editForm.status}
                          onValueChange={(v) =>
                            setEditForm({ ...editForm, status: v as PeriodStatus })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="proximo">Próximo</SelectItem>
                            <SelectItem value="activo">Activo</SelectItem>
                            <SelectItem value="cerrado">Cerrado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => update.mutate()} disabled={update.isPending}>
                        Guardar cambios
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                        <X className="size-4" /> Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div
                    key={p.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border p-3"
                  >
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 text-sm font-medium">
                        {p.name}
                        {p.status === "activo" ? (
                          <CheckCircle2 className="size-4 text-primary" aria-label="Período activo" />
                        ) : null}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(p.start_date)} — {formatDate(p.end_date)}
                        {usage[p.id] ? ` · ${usage[p.id]} actividad(es) registradas` : ""}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={p.status === "activo" ? "default" : "secondary"}>
                        {PERIOD_STATUS_LABELS[p.status as PeriodStatus]}
                      </Badge>
                      <Select
                        value={p.status}
                        onValueChange={(v) =>
                          changeStatus.mutate({ id: p.id, status: v as PeriodStatus })
                        }
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="proximo">Próximo</SelectItem>
                          <SelectItem value="activo">Activo</SelectItem>
                          <SelectItem value="cerrado">Cerrado</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        size="icon"
                        variant="outline"
                        aria-label={`Editar ${p.name}`}
                        onClick={() => startEdit(p)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        aria-label={`Eliminar ${p.name}`}
                        onClick={() => remove.mutate(p.id)}
                        disabled={Boolean(usage[p.id]) || remove.isPending}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                ),
              )}
              {periods.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Este año escolar todavía no tiene períodos definidos.
                </p>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-display text-base">Nuevo período</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="pname">Nombre</Label>
              <Input
                id="pname"
                placeholder="Primer período"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="porder">Orden</Label>
              <Input
                id="porder"
                type="number"
                min={1}
                value={form.order_index}
                onChange={(e) => setForm({ ...form, order_index: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pstart">Inicio</Label>
              <Input
                id="pstart"
                type="date"
                value={form.start_date}
                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pend">Fin</Label>
              <Input
                id="pend"
                type="date"
                value={form.end_date}
                onChange={(e) => setForm({ ...form, end_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Estado inicial</Label>
              <Select
                value={form.status}
                onValueChange={(v) => setForm({ ...form, status: v as PeriodStatus })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="proximo">Próximo</SelectItem>
                  <SelectItem value="activo">Activo</SelectItem>
                  <SelectItem value="cerrado">Cerrado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              className="w-full"
              onClick={() => create.mutate()}
              disabled={!selectedYear || create.isPending}
            >
              <Plus className="size-4" /> Agregar período
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
