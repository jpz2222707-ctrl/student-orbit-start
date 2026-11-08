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
import { formatScore, isPassing, performanceLabel } from "@/lib/domain";
import { loadStudentHistory } from "@/lib/grades";
import { useInstitution } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/panel/historial")({
  component: HistoryPage,
});

function HistoryPage() {
  const { data: institution } = useInstitution();
  const passing = Number(institution?.passing_grade ?? 3);
  const [studentId, setStudentId] = useState("");

  /** Las reglas de la base de datos limitan la lista a los estudiantes que el
   * usuario puede ver: propios, vinculados o todos si es administrador. */
  const { data: students = [] } = useQuery({
    queryKey: ["visible-students"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select("id, first_name, last_name, document_number, document_type")
        .order("last_name");
      if (error) throw error;
      return data ?? [];
    },
  });

  useEffect(() => {
    if (!studentId && students[0]) setStudentId(students[0].id);
  }, [students, studentId]);

  const { data: history = [], isLoading } = useQuery({
    queryKey: ["student-history", studentId],
    enabled: Boolean(studentId),
    queryFn: () => loadStudentHistory(studentId),
  });

  const student = students.find((s) => s.id === studentId);
  const years = Array.from(new Set(history.map((h) => h.year)));

  return (
    <>
      <PanelHeader
        title="Historial académico"
        description="Notas definitivas por año escolar, período y asignatura."
      />

      {students.length > 1 ? (
        <div className="mb-6 max-w-sm space-y-2">
          <Label>Estudiante</Label>
          <Select value={studentId} onValueChange={setStudentId}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccione un estudiante" />
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

      {student ? (
        <p className="mb-6 text-sm text-muted-foreground">
          {student.first_name} {student.last_name} · {student.document_type}{" "}
          {student.document_number}
        </p>
      ) : null}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando historial…</p>
      ) : history.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Todavía no hay calificaciones registradas para este estudiante.
        </p>
      ) : (
        <div className="space-y-8">
          {years.map((year) => (
            <section key={year}>
              <h2 className="mb-3 font-display text-lg">{year}</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {history
                  .filter((h) => h.year === year)
                  .map((entry) => (
                    <Card key={entry.periodId}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <CardTitle className="font-display text-base">{entry.period}</CardTitle>
                            <CardDescription>
                              Promedio del período · {performanceLabel(entry.average)}
                            </CardDescription>
                          </div>
                          <Badge variant={isPassing(entry.average, passing) ? "default" : "destructive"}>
                            {formatScore(entry.average)}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {entry.subjects.map((s) => (
                          <div
                            key={s.subject}
                            className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-1.5 text-sm last:border-0 last:pb-0"
                          >
                            <span className="min-w-0">
                              <span className="font-medium">{s.subject}</span>
                              <span className="block text-xs text-muted-foreground">
                                {s.teacher}
                              </span>
                            </span>
                            <span className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">
                                {performanceLabel(s.final)}
                              </span>
                              <span className="font-medium">{formatScore(s.final)}</span>
                            </span>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
