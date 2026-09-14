import { supabase } from "@/integrations/supabase/client";
import { average, round2, weightedFinal } from "@/lib/domain";

export type SubjectResult = {
  courseSubjectId: string;
  subject: string;
  items: { id: string; name: string; weight: number; score: number | null }[];
  final: number | null;
};

/**
 * Calcula, para un curso y período, la definitiva de cada materia por estudiante.
 * Se apoya en las reglas de la base de datos: solo devuelve lo que el usuario
 * tiene permitido leer.
 */
export async function loadCourseResults(courseId: string, periodId: string) {
  const { data: assignments, error: aError } = await supabase
    .from("course_subjects")
    .select("id, subjects(name)")
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

  const studentIds = Array.from(new Set((scores ?? []).map((s) => s.student_id)));

  const byStudent: Record<string, SubjectResult[]> = {};
  for (const studentId of studentIds) {
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
