-- ============ INSTITUCIÓN ============
INSERT INTO public.institution_settings (name, slogan, mission, vision, history, address, phone, email, min_grade, max_grade, passing_grade)
VALUES (
  'Colegio San Andrés de Bogotá',
  'Formación integral con excelencia académica',
  'Formamos niñas, niños y jóvenes íntegros, críticos y solidarios, mediante una educación de calidad que articula el saber académico, la formación en valores y el compromiso con la comunidad.',
  'En 2030 seremos una institución reconocida en la región por la excelencia académica, la innovación pedagógica y la formación de ciudadanos capaces de transformar su entorno.',
  'La institución inició labores en 1985 como una pequeña escuela de barrio y hoy atiende a cerca de 200 estudiantes desde preescolar hasta grado once.',
  'Calle 45 # 12-34, Bogotá D.C.',
  '+57 601 555 1234',
  'contacto@colegiosanandres.edu.co',
  1.00, 5.00, 3.00
);

-- ============ NOTICIAS Y EVENTOS ============
INSERT INTO public.news (title, summary, body, published_at, is_demo) VALUES
('Inicio del año escolar 2026', 'Damos la bienvenida a estudiantes y familias al nuevo año académico.', 'El primer período académico inicia con actividades de bienvenida, socialización del manual de convivencia y entrega de horarios por curso.', now() - interval '10 days', true),
('Resultados destacados en pruebas de matemáticas', 'Nuestros estudiantes de grado once obtuvieron un promedio superior al departamental.', 'El área de matemáticas presentó los resultados del último simulacro, con avances importantes en razonamiento cuantitativo.', now() - interval '5 days', true),
('Abiertas las inscripciones para preescolar', 'Cupos limitados para el nivel de preescolar del próximo año.', 'Las familias interesadas pueden solicitar información en la oficina de admisiones o a través del formulario de contacto.', now() - interval '2 days', true);

INSERT INTO public.events (title, description, location, starts_at, is_demo) VALUES
('Entrega de boletines del primer período', 'Reunión de padres de familia por curso con los directores de grupo.', 'Auditorio principal', now() + interval '12 days', true),
('Feria de ciencia y tecnología', 'Exposición de proyectos de investigación escolar.', 'Patio central', now() + interval '25 days', true),
('Jornada deportiva intercursos', 'Competencias de fútbol, baloncesto y atletismo.', 'Polideportivo', now() + interval '40 days', true);

-- ============ AÑO Y PERÍODOS ============
INSERT INTO public.academic_years (year, name, is_active, is_demo) VALUES (2026, 'Año escolar 2026', true, true);

INSERT INTO public.academic_periods (academic_year_id, name, order_index, start_date, end_date, status, is_demo)
SELECT ay.id, v.name, v.ord, v.sd, v.ed, v.st::public.period_status, true
FROM public.academic_years ay,
(VALUES
  ('Primer período', 1, DATE '2026-01-26', DATE '2026-04-03', 'activo'),
  ('Segundo período', 2, DATE '2026-04-06', DATE '2026-06-12', 'proximo'),
  ('Tercer período', 3, DATE '2026-07-06', DATE '2026-09-11', 'proximo'),
  ('Cuarto período', 4, DATE '2026-09-14', DATE '2026-11-27', 'proximo')
) AS v(name, ord, sd, ed, st)
WHERE ay.year = 2026;

-- ============ GRADOS ============
INSERT INTO public.grade_levels (name, level, is_demo) VALUES
('Preescolar', 0, true), ('Primero', 1, true), ('Segundo', 2, true), ('Tercero', 3, true),
('Cuarto', 4, true), ('Quinto', 5, true), ('Sexto', 6, true), ('Séptimo', 7, true),
('Octavo', 8, true), ('Noveno', 9, true), ('Décimo', 10, true), ('Undécimo', 11, true);

-- ============ MATERIAS ============
INSERT INTO public.subjects (code, name, description, is_demo) VALUES
('MAT', 'Matemáticas', 'Pensamiento numérico, algebraico y geométrico', true),
('LEN', 'Lengua Castellana', 'Comprensión y producción textual', true),
('ING', 'Inglés', 'Lengua extranjera', true),
('FIS', 'Física', 'Ciencias naturales - física', true),
('QUI', 'Química', 'Ciencias naturales - química', true),
('SOC', 'Ciencias Sociales', 'Historia, geografía y democracia', true),
('EDF', 'Educación Física', 'Deporte y recreación', true),
('ART', 'Educación Artística', 'Expresión artística y cultural', true);

-- ============ DOCENTES ============
INSERT INTO public.teachers (document_type, document_number, first_name, last_name, email, phone, is_demo) VALUES
('CC', '79123456', 'Carolina', 'Restrepo Díaz', 'docente@demo.edu.co', '+57 310 555 0101', true),
('CC', '52987654', 'Andrés', 'Muñoz Torres', 'amunoz@demo.edu.co', '+57 310 555 0102', true),
('CC', '41556677', 'Liliana', 'Gómez Parra', 'lgomez@demo.edu.co', '+57 310 555 0103', true),
('CC', '80443322', 'Jorge', 'Cárdenas Ruiz', 'jcardenas@demo.edu.co', '+57 310 555 0104', true);

-- ============ CURSOS ============
INSERT INTO public.courses (code, name, grade_level_id, academic_year_id, homeroom_teacher_id, is_demo)
SELECT v.code, v.name, gl.id, ay.id, t.id, true
FROM (VALUES
  ('1-01', 'Primero A', 'Primero', '79123456'),
  ('1-02', 'Primero B', 'Primero', '52987654'),
  ('10-01', 'Décimo A', 'Décimo', '41556677'),
  ('11-01', 'Undécimo A', 'Undécimo', '79123456')
) AS v(code, name, grade_name, doc)
JOIN public.grade_levels gl ON gl.name = v.grade_name
JOIN public.academic_years ay ON ay.year = 2026
LEFT JOIN public.teachers t ON t.document_number = v.doc;

-- ============ ESTUDIANTES ============
INSERT INTO public.students (document_type, document_number, first_name, last_name, birth_date, email, phone, address, status, is_demo) VALUES
('TI', '1010101010', 'Juan David', 'Pérez Ramírez', DATE '2008-03-12', 'estudiante@demo.edu.co', '+57 320 555 1001', 'Carrera 10 # 20-30', 'activo', true),
('TI', '1010101011', 'María Fernanda', 'López Silva', DATE '2008-06-25', 'mlopez@demo.edu.co', '+57 320 555 1002', 'Calle 33 # 4-15', 'activo', true),
('TI', '1010101012', 'Santiago', 'Rojas Mejía', DATE '2008-01-08', 'srojas@demo.edu.co', NULL, 'Av. 68 # 40-11', 'activo', true),
('TI', '1010101013', 'Valentina', 'Ortiz Cano', DATE '2008-09-30', 'vortiz@demo.edu.co', NULL, 'Calle 12 # 8-90', 'activo', true),
('TI', '1010101014', 'Camilo', 'Herrera Vargas', DATE '2008-11-02', 'cherrera@demo.edu.co', NULL, 'Carrera 7 # 60-22', 'matriculado', true),
('TI', '1010101015', 'Laura', 'Castaño Ríos', DATE '2009-02-17', 'lcastano@demo.edu.co', NULL, 'Calle 80 # 15-40', 'activo', true),
('RC', '1020202001', 'Sofía', 'Marín Gil', DATE '2019-05-14', NULL, NULL, 'Calle 22 # 5-60', 'activo', true),
('RC', '1020202002', 'Emiliano', 'Torres Peña', DATE '2019-08-21', NULL, NULL, 'Carrera 30 # 9-18', 'activo', true),
('RC', '1020202003', 'Isabella', 'Núñez Ávila', DATE '2019-11-05', NULL, NULL, 'Calle 45 # 3-77', 'activo', true),
('TI', '1030303001', 'Mateo', 'Salazar Bravo', DATE '2010-04-19', NULL, NULL, 'Calle 100 # 11-20', 'activo', true),
('TI', '1030303002', 'Antonia', 'Vega Cortés', DATE '2010-07-07', NULL, NULL, 'Carrera 15 # 70-30', 'activo', true),
('TI', '1030303003', 'Tomás', 'Quintero Lara', DATE '2010-12-01', NULL, NULL, 'Calle 63 # 24-05', 'retirado', true);

-- ============ ACUDIENTE ============
INSERT INTO public.guardians (document_type, document_number, first_name, last_name, email, phone, is_demo)
VALUES ('CC', '19556677', 'Marta', 'Ramírez Duque', 'acudiente@demo.edu.co', '+57 315 555 2001', true);

INSERT INTO public.guardian_students (guardian_id, student_id, relationship)
SELECT g.id, s.id, 'Madre'
FROM public.guardians g, public.students s
WHERE g.document_number = '19556677' AND s.document_number = '1010101010';

-- ============ MATRÍCULAS ============
INSERT INTO public.enrollments (student_id, course_id, academic_year_id, is_demo)
SELECT s.id, c.id, ay.id, true
FROM public.students s
JOIN public.academic_years ay ON ay.year = 2026
JOIN public.courses c ON c.academic_year_id = ay.id AND c.code = CASE
  WHEN s.document_number LIKE '10101010%' THEN '11-01'
  WHEN s.document_number LIKE '10202020%' THEN '1-01'
  ELSE '10-01'
END
WHERE s.is_demo;

-- ============ MATERIAS DEL CURSO 11-01 ============
INSERT INTO public.course_subjects (course_id, subject_id, teacher_id, weekly_hours, is_demo)
SELECT c.id, sub.id, t.id, v.hours, true
FROM (VALUES
  ('MAT', '79123456', 5),
  ('LEN', '52987654', 4),
  ('ING', '41556677', 3),
  ('FIS', '79123456', 4),
  ('QUI', '80443322', 3),
  ('SOC', '52987654', 2)
) AS v(subject_code, teacher_doc, hours)
JOIN public.subjects sub ON sub.code = v.subject_code
JOIN public.teachers t ON t.document_number = v.teacher_doc
JOIN public.academic_years ay ON ay.year = 2026
JOIN public.courses c ON c.academic_year_id = ay.id AND c.code = '11-01';

-- ============ ACTIVIDADES DEL PRIMER PERÍODO ============
INSERT INTO public.grade_items (course_subject_id, period_id, name, weight, order_index, is_demo)
SELECT cs.id, p.id, v.name, v.w, v.ord, true
FROM public.course_subjects cs
JOIN public.courses c ON c.id = cs.course_id AND c.code = '11-01'
JOIN public.academic_years ay ON ay.id = c.academic_year_id AND ay.year = 2026
JOIN public.academic_periods p ON p.academic_year_id = ay.id AND p.order_index = 1,
(VALUES ('Actividad 1', 30, 1), ('Actividad 2', 30, 2), ('Examen', 40, 3)) AS v(name, w, ord);

-- ============ NOTAS DE EJEMPLO ============
INSERT INTO public.grade_scores (grade_item_id, student_id, score)
SELECT gi.id, s.id,
  ROUND((3.0 + ((abs(hashtext(gi.id::text || s.id::text)) % 200) / 100.0))::numeric, 2)
FROM public.grade_items gi
JOIN public.course_subjects cs ON cs.id = gi.course_subject_id
JOIN public.enrollments e ON e.course_id = cs.course_id AND e.is_active
JOIN public.students s ON s.id = e.student_id
WHERE gi.is_demo;