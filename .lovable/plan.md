# Sistema de Gestión Académica — Fase 1

Plataforma web para un colegio colombiano (~200 estudiantes) con sitio público institucional y plataforma privada con roles.

## Alcance de esta fase

1. **Backend real (Lovable Cloud)**: base de datos PostgreSQL, autenticación y reglas de seguridad por fila. Nada de datos falsos en memoria: todos los módulos leen y escriben en la base de datos.
2. **Autenticación y roles**: inicio de sesión con correo y contraseña, cierre de sesión, recuperación de contraseña, rutas protegidas y redirección según rol (administrador, docente, estudiante, acudiente preparado).
3. **Sitio público**: Inicio, Nosotros (misión/visión), Oferta académica, Noticias, Eventos, Contacto y botón de acceso al sistema.
4. **Panel privado** con navegación lateral (menú deslizable en celular) y tablero distinto por rol.
5. **Módulos de gestión (administrador)**: estudiantes, docentes, grados, cursos, materias, períodos académicos, asignaciones (docente–materia–curso) y matrícula de estudiantes en cursos.
6. **Calificaciones (docente)**: elige curso → materia → período, ve la lista de sus estudiantes, captura notas por actividad con porcentajes configurables y definitiva calculada automáticamente, con validación de rango y observaciones.
7. **Boletines**: consulta por año → curso → período → estudiante, con datos institucionales, notas, definitivas, promedio y observaciones. Estructura lista para exportar a PDF más adelante.
8. **Vistas del estudiante**: perfil, curso, materias, notas, promedios y sus boletines.
9. **Auditoría**: registro de acciones críticas (usuario, acción, fecha, registro afectado).
10. **Diseño**: identidad institucional propia (azul profundo + dorado, tipografía sobria), tarjetas, tablas con búsqueda y filtros, modales y formularios claros; móvil como prioridad.

Fuera de alcance (fases posteriores): matrículas digitales con documentos, pagos y comprobantes, notificaciones push, app Android, reportes avanzados.

## Seguridad

- Cada usuario solo ve lo que le corresponde, y esa restricción vive en la base de datos, no solo en la pantalla: cambiar un ID en la URL o llamar a la API directamente no expone datos ajenos.
- Los roles se guardan en una tabla aparte de los perfiles para evitar escalación de privilegios.
- Un docente solo puede registrar o modificar notas de los cursos y materias que tiene asignados, y solo en períodos abiertos.
- Un estudiante solo puede leer sus propias notas y boletines.
- Validación de formularios en pantalla y validación equivalente en el servidor.

## Detalles técnicos

- **Stack**: TanStack Start (React 19 + TypeScript + Vite) con funciones de servidor para la lógica protegida; Lovable Cloud (PostgreSQL + Auth + Storage) como backend. No se usa un servidor Express aparte: el runtime de la plataforma ya cumple ese rol y simplifica el despliegue.
- **Tablas**: `profiles`, `user_roles` (+ enum `app_role`), `students`, `teachers`, `guardians` + `guardian_students`, `grades`, `courses`, `subjects`, `course_subjects` (materia+curso+docente), `academic_years`, `academic_periods`, `enrollments`, `grade_items` (actividades y porcentajes), `grade_scores`, `observations`, `report_cards`, `audit_log`. Claves foráneas y únicos donde corresponde; RLS y GRANTs en cada tabla.
- **Datos demo**: semilla con bandera `is_demo` en las tablas principales (grados, cursos, materias, períodos y un conjunto reducido de estudiantes/docentes) y una acción de administrador para borrarla antes de producción.
- **Estructura**: `src/routes/` separa sitio público y `_authenticated/` (panel); `src/features/<modulo>/` agrupa componentes y formularios; `src/lib/*.functions.ts` concentra el acceso a datos del servidor.
- **Orden de construcción**: base de datos y seguridad → autenticación y navegación → catálogos (grados, cursos, materias, períodos) → estudiantes y docentes → asignaciones y matrícula → calificaciones → boletines → sitio público → pruebas de rol.

## Al terminar

Entrego un resumen con arquitectura, estructura de carpetas, modelo de datos, usuarios de prueba, lo implementado, lo pendiente para fases siguientes y la lista de revisiones de seguridad antes de producción.
