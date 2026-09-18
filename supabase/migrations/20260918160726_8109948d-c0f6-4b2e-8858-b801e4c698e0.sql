-- 1. Un solo periodo activo por anio escolar
CREATE OR REPLACE FUNCTION public.enforce_single_active_period()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'activo' THEN
    UPDATE public.academic_periods
    SET status = 'cerrado'
    WHERE academic_year_id = NEW.academic_year_id
      AND id <> NEW.id
      AND status = 'activo';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.enforce_single_active_period() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS periods_single_active ON public.academic_periods;
CREATE TRIGGER periods_single_active
AFTER INSERT OR UPDATE OF status ON public.academic_periods
FOR EACH ROW EXECUTE FUNCTION public.enforce_single_active_period();

-- 2. No eliminar periodos con informacion academica asociada
CREATE OR REPLACE FUNCTION public.protect_period_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.grade_items WHERE period_id = OLD.id)
     OR EXISTS (SELECT 1 FROM public.report_cards WHERE period_id = OLD.id)
     OR EXISTS (SELECT 1 FROM public.observations WHERE period_id = OLD.id) THEN
    RAISE EXCEPTION 'El período tiene información académica asociada: ciérrelo en lugar de eliminarlo';
  END IF;
  RETURN OLD;
END;
$$;

REVOKE ALL ON FUNCTION public.protect_period_delete() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS periods_protect_delete ON public.academic_periods;
CREATE TRIGGER periods_protect_delete
BEFORE DELETE ON public.academic_periods
FOR EACH ROW EXECUTE FUNCTION public.protect_period_delete();

-- 3. Auditoria de actividades evaluables
DROP TRIGGER IF EXISTS audit_grade_items ON public.grade_items;
CREATE TRIGGER audit_grade_items
AFTER INSERT OR UPDATE OR DELETE ON public.grade_items
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

-- 4. Indices para consultas frecuentes
CREATE INDEX IF NOT EXISTS enrollments_course_active_idx ON public.enrollments (course_id, is_active);
CREATE INDEX IF NOT EXISTS course_subjects_course_idx ON public.course_subjects (course_id);
CREATE INDEX IF NOT EXISTS course_subjects_teacher_idx ON public.course_subjects (teacher_id);
CREATE INDEX IF NOT EXISTS academic_periods_year_status_idx ON public.academic_periods (academic_year_id, status);
CREATE INDEX IF NOT EXISTS report_cards_student_idx ON public.report_cards (student_id);