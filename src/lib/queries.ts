import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

/** Datos institucionales (nombre, misión, visión, escala de notas). */
export function useInstitution() {
  return useQuery({
    queryKey: ["institution"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("institution_settings")
        .select("*")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useNews(limit = 20) {
  return useQuery({
    queryKey: ["news", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("news")
        .select("*")
        .eq("is_published", true)
        .order("published_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useEvents(limit = 20) {
  return useQuery({
    queryKey: ["events", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("is_published", true)
        .order("starts_at", { ascending: true })
        .limit(limit);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useGradeLevels() {
  return useQuery({
    queryKey: ["grade_levels"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("grade_levels")
        .select("*")
        .order("level", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useSubjects() {
  return useQuery({
    queryKey: ["subjects"],
    queryFn: async () => {
      const { data, error } = await supabase.from("subjects").select("*").order("name");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useAcademicYears() {
  return useQuery({
    queryKey: ["academic_years"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academic_years")
        .select("*")
        .order("year", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useActiveYear() {
  const years = useAcademicYears();
  return years.data?.find((y) => y.is_active) ?? years.data?.[0] ?? null;
}

export function usePeriods(yearId?: string | null) {
  return useQuery({
    queryKey: ["academic_periods", yearId],
    enabled: Boolean(yearId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academic_periods")
        .select("*")
        .eq("academic_year_id", yearId!)
        .order("order_index");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCourses(yearId?: string | null) {
  return useQuery({
    queryKey: ["courses", yearId],
    enabled: Boolean(yearId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses")
        .select("*, grade_levels(name, level), teachers(first_name, last_name)")
        .eq("academic_year_id", yearId!)
        .order("code");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useTeachers() {
  return useQuery({
    queryKey: ["teachers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("teachers").select("*").order("last_name");
      if (error) throw error;
      return data ?? [];
    },
  });
}
