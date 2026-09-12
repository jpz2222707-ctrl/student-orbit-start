/**
 * Tipos y utilidades del dominio académico.
 * Centraliza etiquetas en español, opciones de formularios y el cálculo de notas.
 */

export type AppRole = "admin" | "teacher" | "student" | "guardian";

export const ROLE_LABELS: Record<AppRole, string> = {
  admin: "Administrador",
  teacher: "Docente",
  student: "Estudiante",
  guardian: "Acudiente",
};

export const ROLE_HOME: Record<AppRole, string> = {
  admin: "/panel",
  teacher: "/panel",
  student: "/panel",
  guardian: "/panel",
};

export type StudentStatus =
  | "preinscrito"
  | "inscrito"
  | "matriculado"
  | "activo"
  | "retirado"
  | "graduado";

export const STUDENT_STATUSES: StudentStatus[] = [
  "preinscrito",
  "inscrito",
  "matriculado",
  "activo",
  "retirado",
  "graduado",
];

export const STUDENT_STATUS_LABELS: Record<StudentStatus, string> = {
  preinscrito: "Preinscrito",
  inscrito: "Inscrito",
  matriculado: "Matriculado",
  activo: "Activo",
  retirado: "Retirado",
  graduado: "Graduado",
};

export type PersonStatus = "activo" | "inactivo";
export const PERSON_STATUS_LABELS: Record<PersonStatus, string> = {
  activo: "Activo",
  inactivo: "Inactivo",
};

export type PeriodStatus = "proximo" | "activo" | "cerrado";
export const PERIOD_STATUS_LABELS: Record<PeriodStatus, string> = {
  proximo: "Próximo",
  activo: "Activo",
  cerrado: "Cerrado",
};

export type DocumentType = "RC" | "TI" | "CC" | "CE" | "PA" | "NUIP";
export const DOCUMENT_TYPES: DocumentType[] = ["RC", "TI", "CC", "CE", "PA", "NUIP"];
export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  RC: "Registro civil",
  TI: "Tarjeta de identidad",
  CC: "Cédula de ciudadanía",
  CE: "Cédula de extranjería",
  PA: "Pasaporte",
  NUIP: "NUIP",
};

/** Escala institucional por defecto (configurable en la base de datos). */
export const DEFAULT_SCALE = { min: 1, max: 5, passing: 3 };

export function fullName(p: { first_name: string; last_name: string }): string {
  return `${p.first_name} ${p.last_name}`.trim();
}

export function formatScore(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return Number(value).toFixed(2);
}

/** Definitiva ponderada. Si no hay porcentajes definidos, promedia simple. */
export function weightedFinal(
  entries: { score: number | null | undefined; weight: number }[],
): number | null {
  const valid = entries.filter((e) => e.score !== null && e.score !== undefined);
  if (valid.length === 0) return null;
  const totalWeight = valid.reduce((acc, e) => acc + (Number(e.weight) || 0), 0);
  if (totalWeight <= 0) {
    return round2(valid.reduce((acc, e) => acc + Number(e.score), 0) / valid.length);
  }
  return round2(valid.reduce((acc, e) => acc + Number(e.score) * Number(e.weight), 0) / totalWeight);
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function average(values: (number | null | undefined)[]): number | null {
  const valid = values.filter((v): v is number => v !== null && v !== undefined && !Number.isNaN(v));
  if (valid.length === 0) return null;
  return round2(valid.reduce((a, b) => a + b, 0) / valid.length);
}

export function isPassing(score: number | null, passing = DEFAULT_SCALE.passing): boolean {
  return score !== null && score >= passing;
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" });
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("es-CO", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
