# Sistema de Gestión Académica — Fase 1

## 1. Arquitectura

- **Frontend + servidor**: TanStack Start (React 19 + TypeScript + Vite). SSR para el sitio público, panel privado sin SSR (`ssr: false`) porque la sesión vive en el navegador.
- **Backend**: Lovable Cloud (PostgreSQL + Auth + funciones de servidor). No hay servidor Express aparte.
- **Datos**: acceso directo a la base desde el navegador con Row Level Security. Las operaciones privilegiadas (crear cuentas, asignar roles, restablecer contraseñas, borrar datos demo) pasan por funciones de servidor que verifican el rol de administrador.
- **Estado y caché**: TanStack Query.
- **UI**: Tailwind v4 con sistema de diseño en `src/styles.css` (azul institucional + dorado, tipografías Fraunces/Manrope) y componentes shadcn.

## 2. Carpetas

```
src/
  routes/                    rutas (una por URL)
    index, nosotros, oferta-academica, noticias, eventos, contacto   sitio público
    auth, restablecer-contrasena                                     acceso
    _authenticated/          zona protegida (redirige a /auth sin sesión)
      panel.*                dashboard, estudiantes, docentes, academico, cursos,
                             calificaciones, boletines, mis-notas, usuarios, auditoria
  components/site/           layout público (header, footer)
  components/panel/          layout del panel (menú por rol)
  components/ui/             componentes base
  hooks/useAuth.tsx          sesión, perfil, roles
  lib/queries.ts             consultas reutilizables
  lib/grades.ts              cálculo de definitivas y promedios
  lib/domain.ts              tipos, etiquetas y utilidades de dominio
  lib/admin.functions.ts     funciones de servidor de administración
  integrations/supabase/     clientes generados (no editar)
```

## 3. Base de datos

- **Personas y acceso**: `profiles`, `user_roles` (roles en tabla separada), `students`, `teachers`, `guardians`, `guardian_students`.
- **Estructura académica**: `academic_years`, `academic_periods`, `grade_levels`, `subjects`, `courses`, `course_subjects` (materia + docente + horas), `enrollments`.
- **Evaluación**: `grade_items` (actividad con porcentaje), `grade_scores` (nota por estudiante), `observations`, `report_cards` (boletín consolidado), vista `subject_period_results`.
- **Institucional/público**: `institution_settings` (escala 1.0–5.0, nota aprobatoria 3.0), `news`, `events`, `contact_messages`.
- **Trazabilidad**: `audit_log` con disparadores en las tablas sensibles.
- Todas las tablas con RLS activo y permisos explícitos por rol.

## 4. Seguridad

- Roles en `user_roles` (nunca en el perfil) y funciones `has_role`, `is_admin`, `current_teacher_id`, `current_student_id`, `teaches_course_subject`, `is_guardian_of`, `period_is_open`.
- Administrador: gestión total. Docente: solo lee y escribe notas de sus materias y únicamente en períodos activos. Estudiante: solo su información. Acudiente: solo los estudiantes vinculados.
- Público anónimo: solo institución, noticias y eventos publicados, y envío de mensajes de contacto.
- Auditoría legible únicamente por administradores; nadie puede modificarla.
- Las funciones de servidor revalidan el rol antes de cualquier operación privilegiada.

## 5. Variables de entorno

Gestionadas automáticamente por Lovable Cloud: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID` (navegador) y `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (servidor). No requieren configuración manual.

## 6. Ejecución y despliegue

- Desarrollo: la vista previa se actualiza automáticamente (`bun run dev`).
- Despliegue: botón **Publish**. La misma base de datos sirve a la vista previa y al sitio publicado.

## 7. Usuarios de prueba (contraseña `Demo2026*`)

| Correo | Rol |
| --- | --- |
| admin@demo.edu.co | Administrador |
| docente@demo.edu.co | Docente (11-01, 6 materias) |
| estudiante@demo.edu.co | Estudiante |
| acudiente@demo.edu.co | Acudiente |

Cambie estas contraseñas antes de usar el sistema con datos reales.

## 8. Implementado en la Fase 1

Sitio institucional público; acceso con correo y contraseña más recuperación; dashboards por rol; CRUD de estudiantes, docentes, grados, materias, años y períodos; cursos, asignación de materias con docente y matrículas; actividades con porcentajes, registro de notas y definitiva ponderada; boletines consolidados por período con impresión; consulta de notas para estudiantes y acudientes; gestión de cuentas y roles; auditoría; datos de demostración marcados y eliminables desde el panel.

## 9. Pendiente para fases siguientes

Matrículas en línea con documentos, pagos y comprobantes, notificaciones por correo o push, aplicación móvil, reportes estadísticos avanzados, carga masiva desde Excel y almacenamiento de archivos (fotos, actas).
