import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Save, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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
import { formatScore, isPassing, weightedFinal } from "@/lib/domain";
import { useActiveYear, useInstitution, usePeriods } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/panel/calificaciones")({
  component: GradesPage,
});

function GradesPage() {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const year = useActiveYear();
  const { data: institution } = useInstitution();
  const { data: periods = [] } = usePeriods(year?.id);

  const [assignmentId, setAssignmentId] = useState("");
  const [periodId, setPeriodId] = useState("");
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [newItem, setNewItem] = useState({ name: "", weight: "" });

  const passing = Number(institution?.passing_grade ?? 3);
  const maxGrade = Number(institution?.max_grade ?? 5);
  const minGrade = Number(institution?.min_grade ?? 1);

  useEffect(() => {
    const active = periods.find((p) => p.status === "activo");
    if (active && !periodId) setPeriodId(active.id);
  }, [periods, periodId]);

  /** Materias visibles: las reglas de la base de datos limitan al docente a las suyas. */
  const { data: assignments = [] } = useQuery({
    queryKey: ["grading-assignments", year?.id],
    enabled: Boolean(year?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("course_subjects")
        .select("id, courses!inner(id, code, name, academic_year_id), subjects(name)")
        .eq("courses.academic_year_id", year!.id);
      if (error) throw error;
      return data ?? [];
    },
  });

  const selected = assignments.find((a) => a.id === assignmentId);
  const selectedPeriod = periods.find((p) => p.id === periodId);
  const periodOpen = selectedPeriod?.status === "activo";
  const canEdit = auth.isAdmin || (auth.isTeacher && periodOpen);

  const { data: items = [] } = useQuery({
    queryKey: ["grade_items", assignmentId, periodId],
    enabled: Boolean(assignmentId && periodId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("grade_items")
        .select("id, name, weight, order_index")
        .eq("course_subject_id", assignmentId)
        .eq("period_id", periodId)
        .order("order_index");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: students = [] } = useQuery({
    queryKey: ["course-students", selected?.courses?.id],
    enabled: Boolean(selected?.courses?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("enrollments")
        .select("student_id, students(id, first_name, last_name)")
        .eq("course_id", selected!.courses!.id)
        .eq("is_active", true);
      if (error) throw error;
      return (data ?? [])
        .map((row) => row.students)
        .filter((s): s is { id: string; first_name: string; last_name: string } => Boolean(s))
        .sort((a, b) => a.last_name.localeCompare(b.last_name));
    },
  });

  const itemIds = useMemo(() => items.map((i) => i.id), [items]);

  const { data: scores = [] } = useQuery({
    queryKey: ["grade_scores", itemIds],
    enabled: itemIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("grade_scores")
        .select("id, grade_item_id, student_id, score")
        .in("grade_item_id", itemIds);
      if (error) throw error;
      return data ?? [];
    },
  });

  const scoreOf = (studentId: string, itemId: string) => {
    const key = `${studentId}:${itemId}`;
    if (key in draft) return draft[key]!;
    const found = scores.find((s) => s.student_id === studentId && s.grade_item_id === itemId);
    return found ? String(found.score) : "";
  };

  const createItem = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("grade_items").insert({
        course_subject_id: assignmentId,
        period_id: periodId,
        name: newItem.name.trim(),
        weight: Number(newItem.weight),
        order_index: items.length + 1,
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Actividad creada");
      setNewItem({ name: "", weight: "" });
      await queryClient.invalidateQueries({ queryKey: ["grade_items"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("grade_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Actividad eliminada");
      await queryClient.invalidateQueries({ queryKey: ["grade_items"] });
      await queryClient.invalidateQueries({ queryKey: ["grade_scores"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const saveScores = useMutation({
    mutationFn: async () => {
      const rows = Object.entries(draft)
        .filter(([, value]) => value.trim() !== "")
        .map(([key, value]) => {
          const [studentId, itemId] = key.split(":");
          return { student_id: studentId!, grade_item_id: itemId!, score: Number(value) };
        });
      const invalid = rows.find((r) => Number.isNaN(r.score) || r.score < minGrade || r.score > maxGrade);
      if (invalid) throw new Error(`Las notas deben estar entre ${minGrade} y ${maxGrade}`);
      if (rows.length === 0) throw new Error("No hay cambios por guardar");
      const { error } = await supabase
        .from("grade_scores")
        .upsert(rows, { onConflict: "grade_item_id,student_id" });
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Calificaciones guardadas");
      setDraft({});
      await queryClient.invalidateQueries({ queryKey: ["grade_scores"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const totalWeight = items.reduce((acc, i) => acc + Number(i.weight), 0);

  if (!auth.isAdmin && !auth.isTeacher) {
    return (
      <p className="text-sm text-muted-foreground">
        Esta sección es solo para docentes y administradores.
      </p>
    );
  }

  return (
    <>
      <PanelHeader
        title="Calificaciones"
        description="Defina las actividades con su porcentaje y registre las notas del período."
      />

      <Card className="mb-6">
        <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Curso y materia</Label>
            <Select value={assignmentId} onValueChange={setAssignmentId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccione" />
              </SelectTrigger>
              <SelectContent>
                {assignments.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.courses?.code} · {a.subjects?.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Período</Label>
            <Select value={periodId} onValueChange={setPeriodId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccione" />
              </SelectTrigger>
              <SelectContent>
                {periods.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} {p.status === "activo" ? "(activo)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {assignments.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No tiene materias asignadas en el año escolar activo.
        </p>
      ) : null}

      {assignmentId && periodId ? (
        <>
          {!periodOpen && !auth.isAdmin ? (
            <p className="mb-4 rounded-md border border-border bg-secondary/60 p-3 text-sm text-muted-foreground">
              El período está cerrado: puede consultar las notas, pero no modificarlas.
            </p>
          ) : null}

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="font-display text-lg">Actividades del período</CardTitle>
              <CardDescription>
                Suma de porcentajes: {totalWeight}%{" "}
                {totalWeight !== 100 ? "· la definitiva se pondera con la suma actual" : ""}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {items.map((i) => (
                  <Badge key={i.id} variant="secondary" className="gap-2 py-1.5 text-sm">
                    {i.name} · {Number(i.weight)}%
                    {canEdit ? (
                      <button
                        type="button"
                        aria-label={`Eliminar ${i.name}`}
                        onClick={() => removeItem.mutate(i.id)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    ) : null}
                  </Badge>
                ))}
                {items.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Todavía no hay actividades en este período.
                  </p>
                ) : null}
              </div>

              {canEdit ? (
                <div className="flex flex-wrap items-end gap-3 border-t border-border pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="iname">Actividad</Label>
                    <Input
                      id="iname"
                      className="w-48"
                      value={newItem.name}
                      onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="iweight">Porcentaje</Label>
                    <Input
                      id="iweight"
                      className="w-28"
                      type="number"
                      min={1}
                      max={100}
                      value={newItem.weight}
                      onChange={(e) => setNewItem({ ...newItem, weight: e.target.value })}
                    />
                  </div>
                  <Button
                    onClick={() => createItem.mutate()}
                    disabled={!newItem.name.trim() || !newItem.weight || createItem.isPending}
                  >
                    <Plus className="size-4" /> Agregar
                  </Button>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <div className="overflow-x-auto rounded-lg border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-48">Estudiante</TableHead>
                  {items.map((i) => (
                    <TableHead key={i.id} className="text-center">
                      {i.name}
                      <span className="block text-xs font-normal text-muted-foreground">
                        {Number(i.weight)}%
                      </span>
                    </TableHead>
                  ))}
                  <TableHead className="text-center">Definitiva</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={items.length + 2} className="text-sm text-muted-foreground">
                      No hay estudiantes matriculados en este curso.
                    </TableCell>
                  </TableRow>
                ) : (
                  students.map((s) => {
                    const final = weightedFinal(
                      items.map((i) => {
                        const raw = scoreOf(s.id, i.id);
                        return { score: raw === "" ? null : Number(raw), weight: Number(i.weight) };
                      }),
                    );
                    return (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">
                          {s.last_name}, {s.first_name}
                        </TableCell>
                        {items.map((i) => (
                          <TableCell key={i.id} className="text-center">
                            <Input
                              className="mx-auto w-20 text-center"
                              inputMode="decimal"
                              disabled={!canEdit}
                              value={scoreOf(s.id, i.id)}
                              onChange={(e) =>
                                setDraft((prev) => ({
                                  ...prev,
                                  [`${s.id}:${i.id}`]: e.target.value,
                                }))
                              }
                            />
                          </TableCell>
                        ))}
                        <TableCell className="text-center">
                          <Badge variant={isPassing(final, passing) ? "default" : "destructive"}>
                            {formatScore(final)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {canEdit && items.length > 0 ? (
            <div className="mt-4 flex items-center gap-3">
              <Button
                onClick={() => saveScores.mutate()}
                disabled={Object.keys(draft).length === 0 || saveScores.isPending}
              >
                <Save className="size-4" />
                {saveScores.isPending ? "Guardando…" : "Guardar calificaciones"}
              </Button>
              {Object.keys(draft).length > 0 ? (
                <span className="text-sm text-muted-foreground">Hay cambios sin guardar</span>
              ) : null}
            </div>
          ) : null}
        </>
      ) : null}
    </>
  );
}
