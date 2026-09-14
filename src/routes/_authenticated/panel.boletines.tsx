import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Printer, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { PanelHeader } from "@/components/panel/PanelLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { formatDateTime, formatScore, isPassing } from "@/lib/domain";
import { loadCourseResults, overallAverage } from "@/lib/grades";
import { useActiveYear, useCourses, useInstitution, usePeriods } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/panel/boletines")({
  component: ReportCardsPage,
});

function ReportCardsPage() {
  const auth = useAuth();
  const staff = auth.isAdmin || auth.isTeacher;
  return (
    <>
      <PanelHeader
        title="Boletines"
        description={
          staff
            ? "Consolide las definitivas del período y guarde el boletín de cada estudiante."
            : "Boletines publicados por la institución."
        }
      />
      {staff ? <StaffReportCards /> : <StudentReportCards />}
    </>
  );
}

function StaffReportCards() {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const year = useActiveYear();
  const { data: institution } = useInstitution();
  const { data: courses = [] } = useCourses(year?.id);
  const { data: periods = [] } = usePeriods(year?.id);
  const [courseId, setCourseId] = useState("");
  const [periodId, setPeriodId] = useState("");
  const passing = Number(institution?.passing_grade ?? 3);

  useEffect(() => {
    const active = periods.find((p) => p.status === "activo");
    if (active && !periodId) setPeriodId(active.id);
  }, [periods, periodId]);

  const { data, isLoading } = useQuery({
    queryKey: ["course-results", courseId, periodId],
    enabled: Boolean(courseId && periodId),
    queryFn: () => loadCourseResults(courseId, periodId),
  });

  const { data: students = [] } = useQuery({
    queryKey: ["course-roster", courseId],
    enabled: Boolean(courseId),
    queryFn: async () => {
      const { data: rows, error } = await supabase
        .from("enrollments")
        .select("students(id, first_name, last_name)")
        .eq("course_id", courseId)
        .eq("is_active", true);
      if (error) throw error;
      return (rows ?? [])
        .map((r) => r.students)
        .filter((s): s is { id: string; first_name: string; last_name: string } => Boolean(s))
        .sort((a, b) => a.last_name.localeCompare(b.last_name));
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      if (!data) throw new Error("No hay resultados para guardar");
      const rows = students.map((s) => {
        const results = data.byStudent[s.id] ?? [];
        return {
          student_id: s.id,
          course_id: courseId,
          period_id: periodId,
          average: overallAverage(results),
          payload: {
            student: `${s.first_name} ${s.last_name}`,
            subjects: results.map((r) => ({ subject: r.subject, final: r.final, items: r.items })),
          },
        };
      });
      const { error } = await supabase.from("report_cards").insert(rows);
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Boletines guardados");
      await queryClient.invalidateQueries({ queryKey: ["report_cards"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const subjects = data?.subjects ?? [];

  return (
    <>
      <Card className="mb-6">
        <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Curso</Label>
            <Select value={courseId} onValueChange={setCourseId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccione un curso" />
              </SelectTrigger>
              <SelectContent>
                {courses.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.code} · {c.name}
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
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {courseId && periodId ? (
        isLoading ? (
          <p className="text-sm text-muted-foreground">Calculando definitivas…</p>
        ) : (
          <>
            <div className="overflow-x-auto rounded-lg border border-border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-48">Estudiante</TableHead>
                    {subjects.map((s) => (
                      <TableHead key={s.id} className="text-center">
                        {s.name}
                      </TableHead>
                    ))}
                    <TableHead className="text-center">Promedio</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={subjects.length + 2}
                        className="text-sm text-muted-foreground"
                      >
                        Este curso no tiene estudiantes matriculados.
                      </TableCell>
                    </TableRow>
                  ) : (
                    students.map((s) => {
                      const results = data?.byStudent[s.id] ?? [];
                      const avg = overallAverage(results);
                      return (
                        <TableRow key={s.id}>
                          <TableCell className="font-medium">
                            {s.last_name}, {s.first_name}
                          </TableCell>
                          {subjects.map((sub) => {
                            const found = results.find((r) => r.courseSubjectId === sub.id);
                            return (
                              <TableCell key={sub.id} className="text-center text-sm">
                                {formatScore(found?.final ?? null)}
                              </TableCell>
                            );
                          })}
                          <TableCell className="text-center">
                            <Badge variant={isPassing(avg, passing) ? "default" : "destructive"}>
                              {formatScore(avg)}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              {auth.isAdmin ? (
                <Button onClick={() => save.mutate()} disabled={save.isPending || students.length === 0}>
                  <Save className="size-4" />
                  {save.isPending ? "Guardando…" : "Guardar boletines del período"}
                </Button>
              ) : null}
              <Button variant="outline" onClick={() => window.print()}>
                <Printer className="size-4" /> Imprimir
              </Button>
            </div>
          </>
        )
      ) : null}
    </>
  );
}

function StudentReportCards() {
  const { data: cards = [], isLoading } = useQuery({
    queryKey: ["report_cards"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("report_cards")
        .select("id, average, generated_at, payload, academic_periods(name), courses(code, name)")
        .order("generated_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Cargando boletines…</p>;
  if (cards.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Todavía no hay boletines publicados. Consulte sus notas en la sección Mis notas.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {cards.map((card) => {
        const payload = card.payload as {
          subjects?: { subject: string; final: number | null }[];
        } | null;
        return (
          <Card key={card.id}>
            <CardHeader>
              <CardTitle className="font-display text-lg">
                {card.academic_periods?.name} · {card.courses?.code}
              </CardTitle>
              <CardDescription>
                Generado el {formatDateTime(card.generated_at)} · Promedio{" "}
                {formatScore(card.average)}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {(payload?.subjects ?? []).map((s) => (
                <div key={s.subject} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{s.subject}</span>
                  <span className="font-medium">{formatScore(s.final)}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
