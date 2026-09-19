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
import { formatScore, isPassing, performanceLabel } from "@/lib/domain";
import { courseAverage, loadCourseResults, loadStudentHistory, overallAverage } from "@/lib/grades";
import { useActiveYear, useCourses, useInstitution, usePeriods } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/panel/boletines")({
  component: ReportCardsPage,
});

type ReportRow = { subject: string; teacher: string; final: number | null };

function ReportCardsPage() {
  const auth = useAuth();
  const staff = auth.isAdmin || auth.isTeacher;
  return (
    <>
      <PanelHeader
        title="Boletines"
        description={
          staff
            ? "Consolide las definitivas del período, revise el boletín de cada estudiante y guárdelo."
            : "Boletín académico del período seleccionado."
        }
      />
      {staff ? <StaffReportCards /> : <StudentReportCards />}
    </>
  );
}

/** Boletín individual reutilizado por el personal y por estudiantes/acudientes. */
function ReportCardDetail({
  student,
  course,
  year,
  period,
  rows,
  passing,
}: {
  student: { first_name: string; last_name: string; document_type?: string; document_number?: string };
  course: string;
  year: string;
  period: string;
  rows: ReportRow[];
  passing: number;
}) {
  const avg = rows.length ? overallAverage(rows.map((r) => ({ ...r, courseSubjectId: "", items: [] }))) : null;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display text-lg">
          {student.first_name} {student.last_name}
        </CardTitle>
        <CardDescription>
          {student.document_type ? `${student.document_type} ${student.document_number} · ` : ""}
          Curso {course || "—"} · Año {year || "—"} · {period || "—"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asignatura</TableHead>
                <TableHead>Docente</TableHead>
                <TableHead className="text-center">Nota</TableHead>
                <TableHead className="text-center">Desempeño</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-sm text-muted-foreground">
                    Sin calificaciones registradas en este período.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((r) => (
                  <TableRow key={r.subject}>
                    <TableCell className="font-medium">{r.subject}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{r.teacher}</TableCell>
                    <TableCell className="text-center">{formatScore(r.final)}</TableCell>
                    <TableCell className="text-center text-sm">
                      {performanceLabel(r.final)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-border pt-4">
          <span className="text-sm text-muted-foreground">Promedio del período</span>
          <Badge variant={isPassing(avg, passing) ? "default" : "destructive"}>
            {formatScore(avg)}
          </Badge>
          <span className="text-sm text-muted-foreground">{performanceLabel(avg)}</span>
        </div>
      </CardContent>
    </Card>
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
  const [detailId, setDetailId] = useState("");
  const passing = Number(institution?.passing_grade ?? 3);

  useEffect(() => {
    const active = periods.find((p) => p.status === "activo");
    if (active && !periodId) setPeriodId(active.id);
  }, [periods, periodId]);

  const { data: students = [] } = useQuery({
    queryKey: ["course-roster", courseId],
    enabled: Boolean(courseId),
    queryFn: async () => {
      const { data: rows, error } = await supabase
        .from("enrollments")
        .select("students(id, first_name, last_name, document_type, document_number)")
        .eq("course_id", courseId)
        .eq("is_active", true);
      if (error) throw error;
      return (rows ?? [])
        .map((r) => r.students)
        .filter((s): s is NonNullable<typeof s> => Boolean(s))
        .sort((a, b) => a.last_name.localeCompare(b.last_name));
    },
  });

  const studentIds = students.map((s) => s.id);

  const { data, isLoading } = useQuery({
    queryKey: ["course-results", courseId, periodId, studentIds.join(",")],
    enabled: Boolean(courseId && periodId),
    queryFn: () => loadCourseResults(courseId, periodId, studentIds),
  });

  const save = useMutation({
    mutationFn: async () => {
      if (!data) throw new Error("No hay resultados para guardar");
      const course = courses.find((c) => c.id === courseId);
      const period = periods.find((p) => p.id === periodId);
      const rows = students.map((s) => {
        const results = data.byStudent[s.id] ?? [];
        return {
          student_id: s.id,
          course_id: courseId,
          period_id: periodId,
          average: overallAverage(results),
          payload: {
            student: `${s.first_name} ${s.last_name}`,
            document: `${s.document_type} ${s.document_number}`,
            course: course ? `${course.code} · ${course.name}` : "",
            year: year?.name ?? "",
            period: period?.name ?? "",
            subjects: results.map((r) => ({
              subject: r.subject,
              teacher: r.teacher,
              final: r.final,
              items: r.items,
            })),
          },
        };
      });
      const { error } = await supabase
        .from("report_cards")
        .upsert(rows, { onConflict: "student_id,period_id" });
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Boletines guardados");
      await queryClient.invalidateQueries({ queryKey: ["report_cards"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const subjects = data?.subjects ?? [];
  const groupAverage = data ? courseAverage(data.byStudent) : null;
  const detailStudent = students.find((s) => s.id === detailId);
  const detailRows: ReportRow[] = detailStudent
    ? (data?.byStudent[detailStudent.id] ?? []).map((r) => ({
        subject: r.subject,
        teacher: r.teacher,
        final: r.final,
      }))
    : [];

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
                    <TableHead className="text-center">Desempeño</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={subjects.length + 4}
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
                          <TableCell className="text-center text-sm">
                            {performanceLabel(avg)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="outline" size="sm" onClick={() => setDetailId(s.id)}>
                              Ver boletín
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            <p className="mt-3 text-sm text-muted-foreground">
              Promedio general del curso: <strong>{formatScore(groupAverage)}</strong>
            </p>

            <div className="mt-4 flex flex-wrap gap-3">
              {auth.isAdmin ? (
                <Button
                  onClick={() => save.mutate()}
                  disabled={save.isPending || students.length === 0}
                >
                  <Save className="size-4" />
                  {save.isPending ? "Guardando…" : "Guardar boletines del período"}
                </Button>
              ) : null}
              <Button variant="outline" onClick={() => window.print()}>
                <Printer className="size-4" /> Imprimir
              </Button>
            </div>

            {detailStudent ? (
              <div className="mt-6">
                <ReportCardDetail
                  student={detailStudent}
                  course={courses.find((c) => c.id === courseId)?.code ?? ""}
                  year={year?.name ?? ""}
                  period={periods.find((p) => p.id === periodId)?.name ?? ""}
                  rows={detailRows}
                  passing={passing}
                />
              </div>
            ) : null}
          </>
        )
      ) : null}
    </>
  );
}

function StudentReportCards() {
  const { data: institution } = useInstitution();
  const passing = Number(institution?.passing_grade ?? 3);
  const [studentId, setStudentId] = useState("");
  const [periodId, setPeriodId] = useState("");

  /** Las reglas de la base de datos limitan la lista al propio estudiante o a
   * los estudiantes vinculados al acudiente. */
  const { data: students = [] } = useQuery({
    queryKey: ["visible-students"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select("id, first_name, last_name, document_type, document_number")
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

  useEffect(() => {
    if (!periodId && history[0]) setPeriodId(history[0].periodId);
  }, [history, periodId]);

  const { data: enrollment } = useQuery({
    queryKey: ["student-course", studentId],
    enabled: Boolean(studentId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("enrollments")
        .select("courses(code, name), academic_years(name)")
        .eq("student_id", studentId)
        .eq("is_active", true)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const student = students.find((s) => s.id === studentId);
  const entry = history.find((h) => h.periodId === periodId);

  if (isLoading) return <p className="text-sm text-muted-foreground">Cargando boletín…</p>;

  return (
    <>
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
              {history.map((h) => (
                <SelectItem key={h.periodId} value={h.periodId}>
                  {h.year} · {h.period}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {!student || history.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Todavía no hay calificaciones registradas para generar el boletín.
        </p>
      ) : (
        <>
          <ReportCardDetail
            student={student}
            course={enrollment?.courses ? `${enrollment.courses.code}` : ""}
            year={entry?.year ?? enrollment?.academic_years?.name ?? ""}
            period={entry?.period ?? ""}
            rows={entry?.subjects ?? []}
            passing={passing}
          />
          <div className="mt-4">
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="size-4" /> Imprimir boletín
            </Button>
          </div>
        </>
      )}
    </>
  );
}
