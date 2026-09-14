import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { PanelHeader } from "@/components/panel/PanelLayout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { formatScore, isPassing, weightedFinal } from "@/lib/domain";
import { useActiveYear, useInstitution, usePeriods } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/panel/mis-notas")({
  component: MyGradesPage,
});

function MyGradesPage() {
  const year = useActiveYear();
  const { data: institution } = useInstitution();
  const { data: periods = [] } = usePeriods(year?.id);
  const [periodId, setPeriodId] = useState("");
  const [studentId, setStudentId] = useState("");
  const passing = Number(institution?.passing_grade ?? 3);

  useEffect(() => {
    const active = periods.find((p) => p.status === "activo");
    if (active && !periodId) setPeriodId(active.id);
  }, [periods, periodId]);

  /** Las reglas de la base de datos limitan esta consulta al propio estudiante
   * o a los estudiantes vinculados al acudiente. */
  const { data: students = [] } = useQuery({
    queryKey: ["visible-students"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select("id, first_name, last_name")
        .order("last_name");
      if (error) throw error;
      return data ?? [];
    },
  });

  useEffect(() => {
    if (!studentId && students[0]) setStudentId(students[0].id);
  }, [students, studentId]);

  const { data: results = [], isLoading } = useQuery({
    queryKey: ["my-grades", studentId, periodId],
    enabled: Boolean(studentId && periodId),
    queryFn: async () => {
      const { data: scores, error } = await supabase
        .from("grade_scores")
        .select(
          "score, grade_items!inner(id, name, weight, period_id, course_subjects(id, subjects(name), courses(code, name)))",
        )
        .eq("student_id", studentId)
        .eq("grade_items.period_id", periodId);
      if (error) throw error;

      const groups = new Map<
        string,
        {
          subject: string;
          course: string;
          items: { name: string; weight: number; score: number }[];
        }
      >();
      for (const row of scores ?? []) {
        const item = row.grade_items;
        const cs = item?.course_subjects;
        if (!item || !cs) continue;
        const key = cs.id;
        if (!groups.has(key)) {
          groups.set(key, {
            subject: cs.subjects?.name ?? "",
            course: cs.courses ? `${cs.courses.code}` : "",
            items: [],
          });
        }
        groups.get(key)!.items.push({
          name: item.name,
          weight: Number(item.weight),
          score: Number(row.score),
        });
      }
      return Array.from(groups.values()).map((g) => ({ ...g, final: weightedFinal(g.items) }));
    },
  });

  const student = students.find((s) => s.id === studentId);

  return (
    <>
      <PanelHeader
        title="Notas del período"
        description={
          student ? `${student.first_name} ${student.last_name}` : "Consulte sus calificaciones"
        }
      />

      <div className="mb-6 grid gap-4 sm:max-w-xl sm:grid-cols-2">
        {students.length > 1 ? (
          <div className="space-y-2">
            <Label>Estudiante</Label>
            <Select value={studentId} onValueChange={setStudentId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccione" />
              </SelectTrigger>
              <SelectContent>
                {students.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.last_name}, {s.first_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}
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
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando notas…</p>
      ) : results.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Todavía no hay calificaciones registradas para este período.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {results.map((r) => (
            <Card key={r.subject}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="font-display text-base">{r.subject}</CardTitle>
                    <CardDescription>{r.course}</CardDescription>
                  </div>
                  <Badge variant={isPassing(r.final, passing) ? "default" : "destructive"}>
                    {formatScore(r.final)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-1.5 pt-2">
                {r.items.map((i) => (
                  <div key={i.name} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {i.name} · {i.weight}%
                    </span>
                    <span className="font-medium">{formatScore(i.score)}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
