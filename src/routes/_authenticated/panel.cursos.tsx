import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Trash2 } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { fullName } from "@/lib/domain";
import { useActiveYear, useCourses, useGradeLevels, useSubjects, useTeachers } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/panel/cursos")({
  component: CoursesPage,
});

function CoursesPage() {
  const auth = useAuth();
  if (!auth.isAdmin) {
    return <p className="text-sm text-muted-foreground">Esta sección es solo para administradores.</p>;
  }

  return (
    <>
      <PanelHeader
        title="Cursos y matrículas"
        description="Cree cursos del año escolar, asigne materias con docente y matricule estudiantes."
      />
      <Tabs defaultValue="cursos">
        <TabsList>
          <TabsTrigger value="cursos">Cursos</TabsTrigger>
          <TabsTrigger value="asignaciones">Asignaciones</TabsTrigger>
          <TabsTrigger value="matriculas">Matrículas</TabsTrigger>
        </TabsList>
        <TabsContent value="cursos" className="mt-6">
          <CoursesTab />
        </TabsContent>
        <TabsContent value="asignaciones" className="mt-6">
          <AssignmentsTab />
        </TabsContent>
        <TabsContent value="matriculas" className="mt-6">
          <EnrollmentsTab />
        </TabsContent>
      </Tabs>
    </>
  );
}

function CoursesTab() {
  const queryClient = useQueryClient();
  const year = useActiveYear();
  const { data: courses = [] } = useCourses(year?.id);
  const { data: levels = [] } = useGradeLevels();
  const { data: teachers = [] } = useTeachers();
  const [form, setForm] = useState({ code: "", name: "", grade_level_id: "", teacher: "" });

  const create = useMutation({
    mutationFn: async () => {
      if (!year) throw new Error("No hay un año escolar activo");
      const { error } = await supabase.from("courses").insert({
        code: form.code.trim(),
        name: form.name.trim(),
        grade_level_id: form.grade_level_id,
        academic_year_id: year.id,
        homeroom_teacher_id: form.teacher || null,
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Curso creado");
      setForm({ code: "", name: "", grade_level_id: "", teacher: "" });
      await queryClient.invalidateQueries({ queryKey: ["courses"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-lg">
            Cursos {year ? `· ${year.name}` : ""}
          </CardTitle>
          <CardDescription>Grupos activos del año escolar en curso.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {courses.map((c) => (
            <div key={c.id} className="rounded-md border border-border p-4">
              <p className="font-display text-base">{c.code}</p>
              <p className="text-sm text-muted-foreground">{c.name}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Director de grupo:{" "}
                {c.teachers ? `${c.teachers.first_name} ${c.teachers.last_name}` : "sin asignar"}
              </p>
            </div>
          ))}
          {courses.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aún no hay cursos creados.</p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-base">Nuevo curso</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="ccode">Código</Label>
            <Input
              id="ccode"
              placeholder="11-01"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cname">Nombre</Label>
            <Input
              id="cname"
              placeholder="Undécimo A"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Grado</Label>
            <Select
              value={form.grade_level_id}
              onValueChange={(v) => setForm({ ...form, grade_level_id: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccione" />
              </SelectTrigger>
              <SelectContent>
                {levels.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Director de grupo</Label>
            <Select value={form.teacher} onValueChange={(v) => setForm({ ...form, teacher: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Opcional" />
              </SelectTrigger>
              <SelectContent>
                {teachers.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {fullName(t)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            className="w-full"
            onClick={() => create.mutate()}
            disabled={
              !form.code.trim() || !form.name.trim() || !form.grade_level_id || create.isPending
            }
          >
            <Plus className="size-4" /> Crear curso
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function AssignmentsTab() {
  const queryClient = useQueryClient();
  const year = useActiveYear();
  const { data: courses = [] } = useCourses(year?.id);
  const { data: subjects = [] } = useSubjects();
  const { data: teachers = [] } = useTeachers();
  const [courseId, setCourseId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [hours, setHours] = useState("");

  const { data: assignments = [] } = useQuery({
    queryKey: ["course_subjects", courseId],
    enabled: Boolean(courseId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("course_subjects")
        .select("id, weekly_hours, subjects(name), teachers(first_name, last_name)")
        .eq("course_id", courseId);
      if (error) throw error;
      return data ?? [];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("course_subjects").insert({
        course_id: courseId,
        subject_id: subjectId,
        teacher_id: teacherId || null,
        weekly_hours: hours ? Number(hours) : null,
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Materia asignada al curso");
      setSubjectId("");
      setTeacherId("");
      setHours("");
      await queryClient.invalidateQueries({ queryKey: ["course_subjects"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("course_subjects").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Asignación eliminada");
      await queryClient.invalidateQueries({ queryKey: ["course_subjects"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-lg">Materias del curso</CardTitle>
          <CardDescription>Cada materia puede tener un docente responsable.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="max-w-xs space-y-2">
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

          {courseId ? (
            <div className="space-y-2">
              {assignments.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between gap-3 rounded-md border border-border p-3"
                >
                  <div>
                    <p className="text-sm font-medium">{a.subjects?.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {a.teachers
                        ? `${a.teachers.first_name} ${a.teachers.last_name}`
                        : "Sin docente asignado"}
                      {a.weekly_hours ? ` · ${a.weekly_hours} h/semana` : ""}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => remove.mutate(a.id)}>
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
              {assignments.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Este curso todavía no tiene materias asignadas.
                </p>
              ) : null}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-base">Asignar materia</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label>Materia</Label>
            <Select value={subjectId} onValueChange={setSubjectId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccione" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Docente</Label>
            <Select value={teacherId} onValueChange={setTeacherId}>
              <SelectTrigger>
                <SelectValue placeholder="Opcional" />
              </SelectTrigger>
              <SelectContent>
                {teachers.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {fullName(t)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="hours">Horas semanales</Label>
            <Input
              id="hours"
              type="number"
              min={1}
              value={hours}
              onChange={(e) => setHours(e.target.value)}
            />
          </div>
          <Button
            className="w-full"
            onClick={() => create.mutate()}
            disabled={!courseId || !subjectId || create.isPending}
          >
            <Plus className="size-4" /> Asignar
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function EnrollmentsTab() {
  const queryClient = useQueryClient();
  const year = useActiveYear();
  const { data: courses = [] } = useCourses(year?.id);
  const [courseId, setCourseId] = useState("");
  const [studentId, setStudentId] = useState("");

  const { data: students = [] } = useQuery({
    queryKey: ["students-basic"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select("id, first_name, last_name, document_number")
        .order("last_name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: enrollments = [] } = useQuery({
    queryKey: ["enrollments", courseId],
    enabled: Boolean(courseId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("enrollments")
        .select("id, is_active, students(first_name, last_name, document_number)")
        .eq("course_id", courseId)
        .order("id");
      if (error) throw error;
      return data ?? [];
    },
  });

  const enroll = useMutation({
    mutationFn: async () => {
      if (!year) throw new Error("No hay un año escolar activo");
      const { error } = await supabase.from("enrollments").insert({
        student_id: studentId,
        course_id: courseId,
        academic_year_id: year.id,
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Estudiante matriculado");
      setStudentId("");
      await queryClient.invalidateQueries({ queryKey: ["enrollments"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggle = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from("enrollments")
        .update({ is_active: isActive })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["enrollments"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-lg">Estudiantes matriculados</CardTitle>
          <CardDescription>Listado del curso seleccionado.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="max-w-xs space-y-2">
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

          {courseId ? (
            <div className="space-y-2">
              {enrollments.map((e) => (
                <div
                  key={e.id}
                  className="flex items-center justify-between gap-3 rounded-md border border-border p-3"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {e.students?.last_name}, {e.students?.first_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Documento {e.students?.document_number}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={e.is_active ? "default" : "secondary"}>
                      {e.is_active ? "Activa" : "Inactiva"}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggle.mutate({ id: e.id, isActive: !e.is_active })}
                    >
                      {e.is_active ? "Retirar" : "Reactivar"}
                    </Button>
                  </div>
                </div>
              ))}
              {enrollments.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Este curso todavía no tiene estudiantes matriculados.
                </p>
              ) : null}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-base">Matricular estudiante</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
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
          <Button
            className="w-full"
            onClick={() => enroll.mutate()}
            disabled={!courseId || !studentId || enroll.isPending}
          >
            <Plus className="size-4" /> Matricular
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
