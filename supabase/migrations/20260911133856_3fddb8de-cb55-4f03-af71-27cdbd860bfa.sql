-- =========================================================
-- FASE 1 - Sistema de Gestión Académica
-- =========================================================

-- ---------- ENUMS ----------
CREATE TYPE public.app_role AS ENUM ('admin', 'teacher', 'student', 'guardian');
CREATE TYPE public.student_status AS ENUM ('preinscrito','inscrito','matriculado','activo','retirado','graduado');
CREATE TYPE public.person_status AS ENUM ('activo','inactivo');
CREATE TYPE public.period_status AS ENUM ('proximo','activo','cerrado');
CREATE TYPE public.document_type AS ENUM ('RC','TI','CC','CE','PA','NUIP');

-- ---------- UTIL ----------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- ---------- PROFILES ----------
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  email text,
  phone text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin');
$$;

-- ---------- INSTITUCIÓN ----------
CREATE TABLE public.institution_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT 'Institución Educativa',
  slogan text,
  mission text,
  vision text,
  history text,
  address text,
  phone text,
  email text,
  logo_url text,
  min_grade numeric(4,2) NOT NULL DEFAULT 1.00,
  max_grade numeric(4,2) NOT NULL DEFAULT 5.00,
  passing_grade numeric(4,2) NOT NULL DEFAULT 3.00,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.institution_settings TO anon, authenticated;
GRANT INSERT, UPDATE ON public.institution_settings TO authenticated;
GRANT ALL ON public.institution_settings TO service_role;
ALTER TABLE public.institution_settings ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.news (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  summary text,
  body text,
  image_url text,
  published_at timestamptz NOT NULL DEFAULT now(),
  is_published boolean NOT NULL DEFAULT true,
  is_demo boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.news TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.news TO authenticated;
GRANT ALL ON public.news TO service_role;
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  location text,
  starts_at timestamptz NOT NULL,
  is_published boolean NOT NULL DEFAULT true,
  is_demo boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.events TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.events TO authenticated;
GRANT ALL ON public.events TO service_role;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.contact_messages TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.contact_messages TO authenticated;
GRANT ALL ON public.contact_messages TO service_role;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- ---------- ACADÉMICO: CATÁLOGOS ----------
CREATE TABLE public.academic_years (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  year integer NOT NULL UNIQUE,
  name text NOT NULL,
  is_active boolean NOT NULL DEFAULT false,
  is_demo boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.grade_levels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  level integer NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  is_demo boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL,
  name text NOT NULL,
  grade_level_id uuid NOT NULL REFERENCES public.grade_levels(id) ON DELETE RESTRICT,
  academic_year_id uuid NOT NULL REFERENCES public.academic_years(id) ON DELETE RESTRICT,
  homeroom_teacher_id uuid,
  is_active boolean NOT NULL DEFAULT true,
  is_demo boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (academic_year_id, code)
);

CREATE TABLE public.subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  is_demo boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.academic_periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academic_year_id uuid NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
  name text NOT NULL,
  order_index integer NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  status public.period_status NOT NULL DEFAULT 'proximo',
  is_demo boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (academic_year_id, order_index),
  CHECK (end_date >= start_date)
);

-- ---------- PERSONAS ----------
CREATE TABLE public.teachers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  document_type public.document_type NOT NULL DEFAULT 'CC',
  document_number text NOT NULL UNIQUE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text,
  phone text,
  status public.person_status NOT NULL DEFAULT 'activo',
  is_demo boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  document_type public.document_type NOT NULL DEFAULT 'TI',
  document_number text NOT NULL UNIQUE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  birth_date date,
  email text,
  phone text,
  address text,
  status public.student_status NOT NULL DEFAULT 'activo',
  is_demo boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.guardians (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  document_type public.document_type NOT NULL DEFAULT 'CC',
  document_number text NOT NULL UNIQUE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text,
  phone text,
  status public.person_status NOT NULL DEFAULT 'activo',
  is_demo boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.guardian_students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guardian_id uuid NOT NULL REFERENCES public.guardians(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  relationship text,
  UNIQUE (guardian_id, student_id)
);

ALTER TABLE public.courses
  ADD CONSTRAINT courses_homeroom_teacher_fkey
  FOREIGN KEY (homeroom_teacher_id) REFERENCES public.teachers(id) ON DELETE SET NULL;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), NEW.email)
  ON CONFLICT (id) DO NOTHING;
  UPDATE public.students SET user_id = NEW.id WHERE user_id IS NULL AND lower(email) = lower(NEW.email);
  UPDATE public.teachers SET user_id = NEW.id WHERE user_id IS NULL AND lower(email) = lower(NEW.email);
  UPDATE public.guardians SET user_id = NEW.id WHERE user_id IS NULL AND lower(email) = lower(NEW.email);
  RETURN NEW;
END; $$;

-- ---------- MATRÍCULA Y ASIGNACIÓN ----------
CREATE TABLE public.enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE RESTRICT,
  academic_year_id uuid NOT NULL REFERENCES public.academic_years(id) ON DELETE RESTRICT,
  enrolled_at timestamptz NOT NULL DEFAULT now(),
  is_active boolean NOT NULL DEFAULT true,
  is_demo boolean NOT NULL DEFAULT false,
  UNIQUE (student_id, academic_year_id)
);

CREATE TABLE public.course_subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE RESTRICT,
  teacher_id uuid REFERENCES public.teachers(id) ON DELETE SET NULL,
  weekly_hours integer,
  is_demo boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (course_id, subject_id)
);

-- ---------- CALIFICACIONES ----------
CREATE TABLE public.grade_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_subject_id uuid NOT NULL REFERENCES public.course_subjects(id) ON DELETE CASCADE,
  period_id uuid NOT NULL REFERENCES public.academic_periods(id) ON DELETE CASCADE,
  name text NOT NULL,
  weight numeric(5,2) NOT NULL DEFAULT 0 CHECK (weight >= 0 AND weight <= 100),
  order_index integer NOT NULL DEFAULT 1,
  is_demo boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX grade_items_cs_period_idx ON public.grade_items (course_subject_id, period_id);

CREATE TABLE public.grade_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  grade_item_id uuid NOT NULL REFERENCES public.grade_items(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  score numeric(4,2) NOT NULL CHECK (score >= 0 AND score <= 5),
  recorded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (grade_item_id, student_id)
);
CREATE INDEX grade_scores_student_idx ON public.grade_scores (student_id);

CREATE TABLE public.observations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  course_subject_id uuid REFERENCES public.course_subjects(id) ON DELETE CASCADE,
  period_id uuid NOT NULL REFERENCES public.academic_periods(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.report_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  period_id uuid NOT NULL REFERENCES public.academic_periods(id) ON DELETE CASCADE,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  average numeric(4,2),
  generated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  generated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, period_id)
);

-- ---------- AUDITORÍA ----------
CREATE TABLE public.audit_log (
  id bigserial PRIMARY KEY,
  user_id uuid,
  user_email text,
  action text NOT NULL,
  entity text NOT NULL,
  entity_id text,
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX audit_log_created_idx ON public.audit_log (created_at DESC);
GRANT SELECT ON public.audit_log TO authenticated;
GRANT ALL ON public.audit_log TO service_role;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- ---------- GRANTS ----------
GRANT SELECT, INSERT, UPDATE, DELETE ON public.academic_years, public.grade_levels, public.courses,
  public.subjects, public.academic_periods, public.teachers, public.students, public.guardians,
  public.guardian_students, public.enrollments, public.course_subjects, public.grade_items,
  public.grade_scores, public.observations, public.report_cards TO authenticated;
GRANT ALL ON public.academic_years, public.grade_levels, public.courses, public.subjects,
  public.academic_periods, public.teachers, public.students, public.guardians,
  public.guardian_students, public.enrollments, public.course_subjects, public.grade_items,
  public.grade_scores, public.observations, public.report_cards TO service_role;
GRANT SELECT ON public.academic_years, public.grade_levels, public.subjects TO anon;

ALTER TABLE public.academic_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grade_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guardians ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guardian_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grade_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grade_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_cards ENABLE ROW LEVEL SECURITY;

-- ---------- FUNCIONES DE APOYO PARA RLS ----------
CREATE OR REPLACE FUNCTION public.current_teacher_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM public.teachers WHERE user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.current_student_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM public.students WHERE user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.teaches_course_subject(_cs_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.course_subjects cs
    JOIN public.teachers t ON t.id = cs.teacher_id
    WHERE cs.id = _cs_id AND t.user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.teaches_course(_course_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.course_subjects cs
    JOIN public.teachers t ON t.id = cs.teacher_id
    WHERE cs.course_id = _course_id AND t.user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.teaches_student(_student_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.enrollments e
    JOIN public.course_subjects cs ON cs.course_id = e.course_id
    JOIN public.teachers t ON t.id = cs.teacher_id
    WHERE e.student_id = _student_id AND e.is_active AND t.user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_guardian_of(_student_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.guardian_students gs
    JOIN public.guardians g ON g.id = gs.guardian_id
    WHERE gs.student_id = _student_id AND g.user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.period_is_open(_period_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.academic_periods WHERE id = _period_id AND status = 'activo');
$$;

-- ---------- POLÍTICAS ----------
CREATE POLICY profiles_select_self ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_admin());
CREATE POLICY profiles_update_self ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.is_admin()) WITH CHECK (id = auth.uid() OR public.is_admin());
CREATE POLICY profiles_insert_self ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid() OR public.is_admin());

CREATE POLICY user_roles_select ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY inst_public_read ON public.institution_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY inst_admin_write ON public.institution_settings FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY news_public_read ON public.news FOR SELECT TO anon, authenticated USING (is_published OR public.is_admin());
CREATE POLICY news_admin_write ON public.news FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY events_public_read ON public.events FOR SELECT TO anon, authenticated USING (is_published OR public.is_admin());
CREATE POLICY events_admin_write ON public.events FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY contact_insert ON public.contact_messages FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY contact_admin_read ON public.contact_messages FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY years_read ON public.academic_years FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY years_write ON public.academic_years FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY levels_read ON public.grade_levels FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY levels_write ON public.grade_levels FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY subjects_read ON public.subjects FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY subjects_write ON public.subjects FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY courses_read ON public.courses FOR SELECT TO authenticated USING (true);
CREATE POLICY courses_write ON public.courses FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY periods_read ON public.academic_periods FOR SELECT TO authenticated USING (true);
CREATE POLICY periods_write ON public.academic_periods FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY cs_read ON public.course_subjects FOR SELECT TO authenticated USING (true);
CREATE POLICY cs_write ON public.course_subjects FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY teachers_read ON public.teachers FOR SELECT TO authenticated USING (true);
CREATE POLICY teachers_write ON public.teachers FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY students_select ON public.students FOR SELECT TO authenticated USING (
  public.is_admin()
  OR user_id = auth.uid()
  OR public.teaches_student(id)
  OR public.is_guardian_of(id)
);
CREATE POLICY students_write ON public.students FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY guardians_select ON public.guardians FOR SELECT TO authenticated USING (public.is_admin() OR user_id = auth.uid());
CREATE POLICY guardians_write ON public.guardians FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY gs_select ON public.guardian_students FOR SELECT TO authenticated USING (public.is_admin() OR public.is_guardian_of(student_id));
CREATE POLICY gs_write ON public.guardian_students FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY enroll_select ON public.enrollments FOR SELECT TO authenticated USING (
  public.is_admin()
  OR student_id = public.current_student_id()
  OR public.teaches_course(course_id)
  OR public.is_guardian_of(student_id)
);
CREATE POLICY enroll_write ON public.enrollments FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY items_select ON public.grade_items FOR SELECT TO authenticated USING (true);
CREATE POLICY items_admin ON public.grade_items FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY items_teacher_insert ON public.grade_items FOR INSERT TO authenticated
  WITH CHECK (public.teaches_course_subject(course_subject_id) AND public.period_is_open(period_id));
CREATE POLICY items_teacher_update ON public.grade_items FOR UPDATE TO authenticated
  USING (public.teaches_course_subject(course_subject_id) AND public.period_is_open(period_id))
  WITH CHECK (public.teaches_course_subject(course_subject_id) AND public.period_is_open(period_id));
CREATE POLICY items_teacher_delete ON public.grade_items FOR DELETE TO authenticated
  USING (public.teaches_course_subject(course_subject_id) AND public.period_is_open(period_id));

CREATE POLICY scores_select ON public.grade_scores FOR SELECT TO authenticated USING (
  public.is_admin()
  OR student_id = public.current_student_id()
  OR public.is_guardian_of(student_id)
  OR EXISTS (SELECT 1 FROM public.grade_items gi WHERE gi.id = grade_item_id AND public.teaches_course_subject(gi.course_subject_id))
);
CREATE POLICY scores_admin ON public.grade_scores FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY scores_teacher_insert ON public.grade_scores FOR INSERT TO authenticated WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.grade_items gi
    WHERE gi.id = grade_item_id
      AND public.teaches_course_subject(gi.course_subject_id)
      AND public.period_is_open(gi.period_id)
  )
  AND public.teaches_student(student_id)
);
CREATE POLICY scores_teacher_update ON public.grade_scores FOR UPDATE TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.grade_items gi
    WHERE gi.id = grade_item_id
      AND public.teaches_course_subject(gi.course_subject_id)
      AND public.period_is_open(gi.period_id)
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.grade_items gi
    WHERE gi.id = grade_item_id
      AND public.teaches_course_subject(gi.course_subject_id)
      AND public.period_is_open(gi.period_id)
  )
);

CREATE POLICY obs_select ON public.observations FOR SELECT TO authenticated USING (
  public.is_admin()
  OR student_id = public.current_student_id()
  OR public.is_guardian_of(student_id)
  OR public.teaches_student(student_id)
);
CREATE POLICY obs_admin ON public.observations FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY obs_teacher_insert ON public.observations FOR INSERT TO authenticated
  WITH CHECK (public.teaches_student(student_id) AND public.period_is_open(period_id));
CREATE POLICY obs_teacher_update ON public.observations FOR UPDATE TO authenticated
  USING (created_by = auth.uid() AND public.period_is_open(period_id))
  WITH CHECK (created_by = auth.uid() AND public.period_is_open(period_id));

CREATE POLICY reports_select ON public.report_cards FOR SELECT TO authenticated USING (
  public.is_admin()
  OR student_id = public.current_student_id()
  OR public.is_guardian_of(student_id)
  OR public.teaches_course(course_id)
);
CREATE POLICY reports_write ON public.report_cards FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY audit_admin_read ON public.audit_log FOR SELECT TO authenticated USING (public.is_admin());

-- ---------- TRIGGERS ----------
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER students_updated BEFORE UPDATE ON public.students FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER teachers_updated BEFORE UPDATE ON public.teachers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER scores_updated BEFORE UPDATE ON public.grade_scores FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.audit_trigger()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_id text;
  v_details jsonb;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_id := (to_jsonb(OLD)->>'id');
    v_details := jsonb_build_object('old', to_jsonb(OLD));
  ELSIF TG_OP = 'UPDATE' THEN
    v_id := (to_jsonb(NEW)->>'id');
    v_details := jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW));
  ELSE
    v_id := (to_jsonb(NEW)->>'id');
    v_details := jsonb_build_object('new', to_jsonb(NEW));
  END IF;

  INSERT INTO public.audit_log (user_id, user_email, action, entity, entity_id, details)
  VALUES (auth.uid(), (SELECT email FROM auth.users WHERE id = auth.uid()), TG_OP, TG_TABLE_NAME, v_id, v_details);

  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER audit_students AFTER INSERT OR UPDATE OR DELETE ON public.students FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();
CREATE TRIGGER audit_teachers AFTER INSERT OR UPDATE OR DELETE ON public.teachers FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();
CREATE TRIGGER audit_scores AFTER INSERT OR UPDATE OR DELETE ON public.grade_scores FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();
CREATE TRIGGER audit_periods AFTER INSERT OR UPDATE OR DELETE ON public.academic_periods FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();
CREATE TRIGGER audit_enrollments AFTER INSERT OR UPDATE OR DELETE ON public.enrollments FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();
CREATE TRIGGER audit_roles AFTER INSERT OR UPDATE OR DELETE ON public.user_roles FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();
CREATE TRIGGER audit_courses AFTER INSERT OR UPDATE OR DELETE ON public.courses FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

-- ---------- VISTA DE DEFINITIVAS ----------
CREATE VIEW public.subject_period_results
WITH (security_invoker = true) AS
SELECT
  gi.course_subject_id,
  gi.period_id,
  gs.student_id,
  ROUND(
    CASE WHEN SUM(gi.weight) > 0
      THEN SUM(gs.score * gi.weight) / SUM(gi.weight)
      ELSE AVG(gs.score) END, 2) AS final_score,
  COUNT(gs.id) AS scores_count
FROM public.grade_scores gs
JOIN public.grade_items gi ON gi.id = gs.grade_item_id
GROUP BY gi.course_subject_id, gi.period_id, gs.student_id;
GRANT SELECT ON public.subject_period_results TO authenticated;