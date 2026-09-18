# Academia Connect

Sistema de Gestión Académica Escolar — Fase 1

Quiero desarrollar una plataforma web de gestión académica para una institución educativa de Colombia con aproximadamente 200 estudiantes.

IMPORTANTE:

Esta es la FASE 1 del proyecto.

No quiero una simple maqueta ni datos falsos como solución final.

Quiero una aplicación funcional, con persistencia real de datos.

La arquitectura debe quedar preparada para agregar posteriormente módulos de matrículas, pagos, comprobantes, notificaciones y aplicación móvil.

Prioriza calidad, seguridad, mantenibilidad y una interfaz profesional.

No agregues funcionalidades de fases posteriores si no son necesarias para esta primera versión.

1. OBJETIVO

Crear un sistema académico centralizado donde el colegio pueda administrar estudiantes, docentes, cursos, materias, períodos académicos y calificaciones.

Los estudiantes podrán iniciar sesión y consultar sus notas y boletines.

La aplicación debe funcionar correctamente desde computador, tablet y celular.

2. ACTORES

Implementa un sistema de autenticación y autorización basado en roles.

Administrador

Puede:

Gestionar estudiantes.

Gestionar docentes.

Gestionar grados.

Gestionar cursos.

Gestionar materias.

Gestionar períodos académicos.

Matricular/asignar estudiantes a cursos.

Asignar docentes a materias y cursos.

Gestionar usuarios.

Registrar y consultar información académica.

Consultar notas.

Generar/consultar boletines.

Consultar dashboard.

Gestionar configuración básica.

Docente

Puede:

Iniciar sesión.

Ver únicamente los cursos que tiene asignados.

Ver estudiantes de sus cursos.

Ver las materias que tiene asignadas.

Seleccionar período académico.

Registrar calificaciones.

Modificar calificaciones según sus permisos.

Registrar observaciones académicas.

Consultar calificaciones registradas.

Consultar su horario si se implementa posteriormente.

Estudiante

Puede:

Iniciar sesión.

Consultar su perfil.

Consultar su curso.

Consultar sus materias.

Consultar sus calificaciones.

Consultar sus promedios.

Consultar sus boletines.

Descargar boletines cuando estén disponibles.

Acudiente

Preparar la arquitectura para este rol, pero en la Fase 1 puede tener funcionalidades limitadas.

Debe quedar preparado para que posteriormente pueda consultar uno o varios estudiantes asociados a su cuenta.

3. MÓDULO DE AUTENTICACIÓN

Crear:

Login.

Cierre de sesión.

Protección de rutas.

Recuperación de contraseña si la infraestructura utilizada lo permite.

Control de acceso por rol.

Persistencia segura de sesión.

Redirección según rol.

IMPORTANTE:

Un usuario nunca debe poder acceder manualmente a información que no le corresponde cambiando IDs en la URL o realizando solicitudes directamente a la API.

Implementar autorización tanto en frontend como en backend.

4. DASHBOARD

Crear un dashboard diferente según el rol.

Administrador

Mostrar:

Número total de estudiantes.

Número de docentes.

Número de cursos.

Número de materias.

Período académico activo.

Actividad reciente.

Accesos rápidos.

Docente

Mostrar:

Cursos asignados.

Materias asignadas.

Cantidad de estudiantes.

Notas pendientes de registrar.

Estudiante

Mostrar:

Nombre.

Curso.

Período actual.

Promedio general.

Materias.

Últimas calificaciones.

Acceso rápido a boletines.

5. MÓDULO DE ESTUDIANTES

Crear CRUD completo.

Campos sugeridos:

ID.

Tipo de documento.

Número de documento.

Nombres.

Apellidos.

Fecha de nacimiento.

Correo.

Teléfono.

Dirección.

Curso.

Estado.

Estados:

Preinscrito.

Inscrito.

Matriculado.

Activo.

Retirado.

Graduado.

Debe permitir:

Crear.

Editar.

Consultar.

Buscar.

Filtrar.

Ver detalle.

Desactivar.

No eliminar físicamente información académica crítica sin una confirmación y control apropiado.

6. MÓDULO DE DOCENTES

CRUD completo.

Campos:

ID.

Documento.

Nombres.

Apellidos.

Correo.

Teléfono.

Estado.

Permitir asignar docentes a:

Cursos.

Materias.

7. MÓDULO DE GRADOS Y CURSOS

Permitir crear:

Grados

Ejemplo:

Preescolar.

Primero.

Segundo.

Tercero.

...

Undécimo.

Cursos

Ejemplo:

1-01.

1-02.

10-01.

11-01.

Cada estudiante debe pertenecer al curso correspondiente durante el período/año académico.

8. MÓDULO DE MATERIAS

Permitir:

Crear materias.

Editar materias.

Activar/desactivar materias.

Asociar materias a cursos.

Asociar docentes a materias.

Ejemplo:

Matemáticas.

Inglés.

Física.

Química.

Ciencias Sociales.

Lengua Castellana.

9. PERÍODOS ACADÉMICOS

Crear un módulo para administrar períodos.

Ejemplo:

Primer período.

Segundo período.

Tercer período.

Cuarto período.

Cada período debe tener:

Nombre.

Fecha de inicio.

Fecha de finalización.

Estado.

Estados:

Próximo.

Activo.

Cerrado.

Solo se deben poder modificar notas de períodos que estén abiertos y según los permisos correspondientes.

10. MÓDULO DE CALIFICACIONES

Este es uno de los módulos principales.

El docente debe poder seleccionar:

Curso → Materia → Período

y visualizar una tabla con sus estudiantes.

Ejemplo:

EstudianteActividad 1Actividad 2ExamenDefinitivaJuan Pérez4.24.54.04.23María López4.84.64.74.70

Permitir configurar porcentajes.

Por ejemplo:

Actividad 1: 30%

Actividad 2: 30%

Examen: 40%

La definitiva debe calcularse automáticamente.

No permitir valores fuera del rango definido por la institución.

Permitir:

Guardar.

Editar.

Validar.

Registrar observaciones.

Consultar historial.

11. BOLETINES

Crear un módulo básico de boletines.

El administrador podrá seleccionar:

Año → Curso → Período → Estudiante

y consultar el boletín.

El boletín debe mostrar:

Logo/nombre institucional.

Nombre del estudiante.

Documento.

Curso.

Período.

Materias.

Calificaciones.

Definitivas.

Promedio.

Observaciones.

Preparar la arquitectura para generar PDF posteriormente.

Los estudiantes deben poder consultar sus boletines.

12. PERFIL DEL ESTUDIANTE

Crear una vista completa del estudiante:

Información personal.

Curso actual.

Materias.

Calificaciones.

Promedio.

Boletines.

Estado académico.

13. PÁGINA WEB INSTITUCIONAL

Crear una página pública profesional.

Secciones:

Inicio.

Nosotros.

Misión.

Visión.

Oferta académica.

Noticias.

Eventos.

Contacto.

Información institucional.

Acceso al sistema.

Debe existir una separación clara entre:

Sitio público.

Plataforma privada.

14. DISEÑO

Quiero un diseño:

Profesional.

Moderno.

Limpio.

Institucional.

Responsive.

Fácil de utilizar.

Adecuado para docentes, padres y estudiantes.

Usar una navegación lateral en el sistema administrativo.

En celular debe convertirse en un menú adaptable.

Utilizar tarjetas, tablas, filtros, buscadores, modales y formularios claros.

Evitar interfaces excesivamente complejas.

15. BASE DE DATOS

Utilizar una base de datos relacional.

Preferiblemente PostgreSQL.

Diseñar correctamente las relaciones entre:

usuarios.

roles.

estudiantes.

docentes.

acudientes.

grados.

cursos.

materias.

períodos.

matrículas/asignaciones académicas.

calificaciones.

boletines.

observaciones.

auditoría.

Evitar duplicación innecesaria de información.

Utilizar claves primarias y foráneas correctamente.

16. SEGURIDAD

Debido a que se manejarán datos personales y académicos de estudiantes, implementar como mínimo:

Autenticación segura.

Autorización por roles.

Protección de rutas.

Validación de formularios.

Validación en backend.

Protección contra acceso no autorizado.

Hash seguro de contraseñas si son gestionadas por la aplicación.

Protección de datos sensibles.

HTTPS en producción.

Control de sesiones.

Registro de acciones críticas.

IMPORTANTE:

No confiar únicamente en las restricciones del frontend.

Las reglas de autorización deben existir también en el backend/base de datos.

17. AUDITORÍA

Preparar un sistema básico de auditoría.

Registrar acciones importantes como:

Creación de estudiantes.

Modificación de estudiantes.

Creación de usuarios.

Modificación de notas.

Cambios de períodos.

Cambios de cursos.

Guardar:

Usuario.

Acción.

Fecha/hora.

Registro afectado.

18. RESPONSIVE

La plataforma debe funcionar correctamente en:

Computadores.

Tablets.

Android.

Diferentes tamaños de pantalla.

La interfaz móvil debe ser una prioridad porque posteriormente será la base para la aplicación móvil.

19. ARQUITECTURA PREPARADA PARA FUTURAS FASES

NO implementar todavía estos módulos, pero diseñar la arquitectura para agregarlos posteriormente:

Fase 2

Matrículas digitales.

Inscripciones.

Documentos.

Acudientes completos.

Fase 3

Pensiones.

Estado de cuenta.

Pagos.

Carga de comprobantes.

Aprobación/rechazo de comprobantes.

Fase 4

Aplicación Android.

Notificaciones push.

Fase 5

Reportes avanzados.

Estadísticas.

Integración con pasarelas de pago.

Funcionalidades adicionales.

No mezclar estos módulos con la Fase 1.

20. TECNOLOGÍAS

Preferentemente utilizar:

Frontend:

React.

TypeScript.

Vite.

Backend:

Node.js.

Express.

TypeScript.

Base de datos:

PostgreSQL.

Storage:

Supabase Storage o almacenamiento compatible con S3.

Autenticación:

Supabase Auth o una solución segura equivalente.

Si utilizas Supabase, aprovechar Row Level Security correctamente.

21. DATOS DE PRUEBA

Durante el desarrollo puedes utilizar datos de prueba, pero:

Diferenciar claramente datos demo de datos reales.

No depender de datos hardcodeados.

Todos los CRUD deben funcionar realmente contra la base de datos.

Preparar una forma sencilla de eliminar los datos de prueba antes de producción.

22. CALIDAD

Antes de considerar terminada la Fase 1:

Probar login.

Probar permisos.

Probar CRUD.

Probar registro de notas.

Probar cálculo de definitivas.

Probar consulta de notas.

Probar boletines.

Probar acceso desde móvil.

Probar usuarios con diferentes roles.

Verificar que un estudiante no pueda consultar información de otro estudiante.

Verificar que un docente no pueda modificar información fuera de sus cursos.

No considerar terminado un módulo únicamente porque la interfaz visual funciona.

23. ENTREGABLE

Quiero que la Fase 1 quede como una aplicación funcional que pueda posteriormente desplegarse en producción para aproximadamente 200 estudiantes.

La estructura del proyecto debe ser limpia, modular y mantenible.

Evita generar código innecesariamente complejo.

Prioriza una arquitectura que permita añadir las siguientes fases sin tener que reconstruir completamente el sistema.

Al finalizar, explícame:

Arquitectura utilizada.

Estructura de carpetas.

Base de datos.

Variables de entorno necesarias.

Cómo ejecutar localmente.

Cómo desplegar.

Usuarios de prueba.

Qué funcionalidades quedaron implementadas.

Qué funcionalidades quedan para las siguientes fases.

Qué configuraciones de seguridad debo revisar antes de ponerlo en producción.

IMPORTANTE: primero construye la Fase 1 funcional y estable. No intentes implementar todo el proyecto completo en una sola generación.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/d539807b-873d-4051-9876-e5892aaca4a3).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
