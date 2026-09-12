-- Separar lectura pública (sin sesión) de lectura administrativa
DROP POLICY news_public_read ON public.news;
CREATE POLICY news_anon_read ON public.news FOR SELECT TO anon USING (is_published);
CREATE POLICY news_auth_read ON public.news FOR SELECT TO authenticated USING (is_published OR public.is_admin());

DROP POLICY events_public_read ON public.events;
CREATE POLICY events_anon_read ON public.events FOR SELECT TO anon USING (is_published);
CREATE POLICY events_auth_read ON public.events FOR SELECT TO authenticated USING (is_published OR public.is_admin());

-- Funciones de trigger: nadie las invoca desde la API
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.audit_trigger() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;

-- Funciones de autorización: solo usuarios con sesión (requeridas por las políticas RLS)
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.current_teacher_id() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.current_student_id() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.teaches_course_subject(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.teaches_course(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.teaches_student(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_guardian_of(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.period_is_open(uuid) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_teacher_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_student_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.teaches_course_subject(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.teaches_course(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.teaches_student(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_guardian_of(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.period_is_open(uuid) TO authenticated;