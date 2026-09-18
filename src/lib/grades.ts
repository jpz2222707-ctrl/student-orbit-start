import { supabase } from "@/integrations/supabase/client";
import { average, round2, weightedFinal } from "@/lib/domain";

export type SubjectResult = {
  courseSubjectId: string;
  subject: string;
  teacher: string;
  items: { id: string; name: string; weight: number; score: number | null }[];
  final: number | null;
};

/**
 * Calcula, para un curso y período, la definitiva de cada materia por estudiante.
 * Se apoya en las reglas de la base de datos: solo devuelve lo que el usuario
 * tiene permitido leer.
 *
 * `studentIds` permite incluir estudiantes matriculados que aún no tienen notas.
 */
export async function loadCourseResults(
  courseId: string,
  periodId: string,
  studentIds: string[] = [],
) {
  const { data: assignments, error: aError } = await supabase
    .from("course_subjects")
    .select("id, subjects(name), teachers(first_name, last_name)")
    .eq("course_id", courseId);
  if (aError) throw aError;

  const assignmentIds = (assignments ?? []).map((a) => a.id);
  if (assignmentIds.length === 0) return { subjects: [], byStudent: {} as Record<string, SubjectResult[]> };

  const { data: items, error: iError } = await supabase
    .from("grade_items")
    .select("id, name, weight, course_subject_id")
    .in("course_subject_id", assignmentIds)
    .eq("period_id", periodId)
    .order("order_index");
  if (iError) throw iError;

  const itemIds = (items ?? []).map((i) => i.id);
  const { data: scores, error: sError } = itemIds.length
    ? await supabase
        .from("grade_scores")
        .select("grade_item_id, student_id, score")
        .in("grade_item_id", itemIds)
    : { data: [], error: null };
  if (sError) throw sError;

  const allStudentIds = Array.from(
    new Set([...(scores ?? []).map((s) => s.student_id), ...studentIds]),
  );

  const byStudent: Record<string, SubjectResult[]> = {};
  for (const studentId of allStudentIds) {
    byStudent[studentId] = (assignments ?? []).map((a) => {
      const subjectItems = (items ?? [])
        .filter((i) => i.course_subject_id === a.id)
        .map((i) => {
          const found = (scores ?? []).find(
            (s) => s.grade_item_id === i.id && s.student_id === studentId,
          );
          return {
            id: i.id,
            name: i.name,
            weight: Number(i.weight),
            score: found ? Number(found.score) : null,
          };
        });
      return {
        courseSubjectId: a.id,
        subject: a.subjects?.name ?? "",
        teacher: a.teachers ? `${a.teachers.first_name} ${a.teachers.last_name}` : "Sin asignar",
        items: subjectItems,
        final: weightedFinal(subjectItems),
      };
    });
  }

  return {
    subjects: (assignments ?? []).map((a) => ({ id: a.id, name: a.subjects?.name ?? "" })),
    byStudent,
  };
}

export function overallAverage(results: SubjectResult[]): number | null {
  const value = average(results.map((r) => r.final));
  return value === null ? null : round2(value);
}

/** Promedio general del curso a partir de las definitivas de sus estudiantes. */
export function courseAverage(byStudent: Record<string, SubjectResult[]>): number | null {
  return average(Object.values(byStudent).map((results) => overallAverage(results)));
}

export type HistoryEntry = {
  yearId: string;
  year: string;
  periodId: string;
  period: string;
  periodOrder: number;
  subjects: { subject: string; teacher: string; final: number | null }[];
  average: number | null;
};

/**
 * Historial académico del estudiante: todas las notas visibles agrupadas por
 * año escolar, período y materia. Las reglas de la base de datos limitan la
 * lectura al propio estudiante o a los estudiantes vinculados al acudiente.
 */
export async function loadStudentHistory(studentId: string): Promise<HistoryEntry[]> {
  const { data, error } = await supabase
    .from("grade_scores")
    .select(
      `score,
       grade_items!inner(
         id, name, weight,
         academic_periods!inner(id, name, order_index, academic_years!inner(id, name, year)),
         course_subjects!inner(id, subjects(name), teachers(first_name, last_name))
       )`,
    )
    .eq("student_id", studentId);
  if (error) throw error;

  type Group = {
    entry: HistoryEntry;
    bySubject: Map<
      string,
      { subject: string; teacher: string; items: { score: number; weight: number }[] }
    >;
  };
  const groups = new Map<string, Group>();

  for (const row of data ?? []) {
    const item = row.grade_items;
    const period = item?.academic_periods;
    const year = period?.academic_years;
    const cs = item?.course_subjects;
    if (!item || !period || !year || !cs) continue;

    if (!groups.has(period.id)) {
      groups.set(period.id, {
        entry: {
          yearId: year.id,
          year: year.name ?? String(year.year),
          periodId: period.id,
          period: period.name,
          periodOrder: period.order_index,
          subjects: [],
          average: null,
        },
        bySubject: new Map(),
      });
    }
    const group = groups.get(period.id)!;
    if (!group.bySubject.has(cs.id)) {
      group.bySubject.set(cs.id, {
        subject: cs.subjects?.name ?? "",
        teacher: cs.teachers ? `${cs.teachers.first_name} ${cs.teachers.last_name}` : "Sin asignar",
        items: [],
      });
    }
    group.bySubject.get(cs.id)!.items.push({
      score: Number(row.score),
      weight: Number(item.weight),
    });
  }

  const entries = Array.from(groups.values()).map(({ entry, bySubject }) => {
    const subjects = Array.from(bySubject.values())
      .map((s) => ({ subject: s.subject, teacher: s.teacher, final: weightedFinal(s.items) }))
      .sort((a, b) => a.subject.localeCompare(b.subject));
    return { ...entry, subjects, average: average(subjects.map((s) => s.final)) };
  });

  return entries.sort(
    (a, b) => b.year.localeCompare(a.year) || a.periodOrder - b.periodOrder,
  );
}
