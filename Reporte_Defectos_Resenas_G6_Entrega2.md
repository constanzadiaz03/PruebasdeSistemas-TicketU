# Reporte de defectos · Reseñas (Grupo QA 6) · Entrega 2

**Servicio:** 6 · Reseñas (`/api/reviews`) · **Ambiente:** https://pruebasdesistemauv.com/ticketu · **Evidencia:** `reporte_integracion.txt`, ejecuciones del 10-11-2026 18:45:37 y 19:10:29 (Newman; la segunda con 51 requests y 78 assertions, 4 fallidas, que corresponden a 2 defectos).

Regla aplicada: si el sistema incumple una HU implementada, es **defecto**; si el caso esperaba otra cosa que la regla implementada, se **ajusta el caso**; si el Swagger del equipo difiere de lo implementado, es una **desalineación de contrato** (se corrige el documento).

| ID | Resumen | Tipo | Severidad | Prioridad | Caso vinculado | Estado |
|---|---|---|---|---|---|---|
| D-01 | El Swagger documenta rutas que no existen (`/resenas`) | Contrato | Media | Media | Colección 1.ª ejecución, CT-03 | Confirmado |
| D-02 | Comentario: el Swagger dice 1000, lo implementado es 500 | Contrato | Media | Media | TestLink ext 11 · CR-06, CR-18 | Confirmado |
| D-03 | El Swagger exige `descripcion`; el sistema la trata como opcional | Contrato | Baja | Media | TestLink ext 6 · CR-14 | Confirmado |
| D-04 | El Swagger envía `id_usuario` en el body; el sistema usa el token | Contrato | Media | Media | I5-01, I5-02 | Por verificar en el YAML |
| D-05 | El Swagger define PUT (modificar), que no está implementado | Contrato | Baja | Baja | TestLink ext 74 (retirado) | Confirmado por HU |
| **D-06** | **La calificación 0 se acepta (201)** | **Sistema** | **Alta** | **Alta** | **TestLink ext 3 · CR-01** | **Confirmado** |
| **D-09** | **Un comentario con lenguaje inapropiado se acepta (201)** | **Sistema** | **Media** | **Media** | **C-04 · CR-07** | **Confirmado** |
| D-07 | Evento aún no terminado | Sistema | — | — | I2-01 | **Descartado** (responde 422) |
| D-08 | El promedio no se recalcula al eliminar | Sistema | — | — | CR-15 | Por verificar |

---

## D-06 · La calificación 0 se acepta como válida

**Proyecto:** TicketU · Reseñas · **Categoría:** API · Validación de entrada
**Severidad:** Alta · **Prioridad:** Alta · **Reproducibilidad:** 2 de 2 ejecuciones (10-11-2026 18:45:37 y 19:10:29)
**Caso vinculado:** TestLink ext 3 «01 - Calificación bajo el valor mínimo» · Newman `CR-01`
**Referencia:** HU-RES-01, «La calificación es un entero de 1 a 5; si no se cumple responde 400».

**Pasos para reproducir**
1. `POST https://pruebasdesistemauv.com/ticketu/api/auth/login` con `beto@ticketu.cl` y la clave de prueba; copiar `token`.
2. Dejar sin reseña a beto en un evento terminado con su check-in (el Taller express). Si ya tiene una, eliminarla con `DELETE /api/reviews/reviews/<id>`.
3. `POST https://pruebasdesistemauv.com/ticketu/api/reviews/reviews` con `Authorization: Bearer <token>` y body `{"eventId": "<id del evento>", "rating": 0}`.

**Resultado esperado:** `400 Bad Request` con `{error:{code,message}}`; no se guarda ninguna reseña.
**Resultado obtenido:** `201 Created` (663 B). La reseña quedó publicada: apareció en `GET /api/reviews/mine` y hubo que eliminarla (`DELETE`, 200). Mientras existió, una segunda reseña válida del mismo usuario respondió `409` (CR-07).

**Contraste (mismo build, misma ejecución):** `rating = 6`, `"cinco"`, `3.5` y la ausencia de nota sí responden 400; solo el valor 0 pasa. Hipótesis a confirmar con TITEC: la validación del límite inferior acepta `0` (por ejemplo, comprueba `>= 0`).

**Justificación de severidad (Alta):** rompe una regla de negocio central (nota de 1 a 5) y persiste un dato inválido que distorsiona el promedio de un evento; no hay pérdida de datos ni caída del servicio, por eso no es crítica.
**Justificación de prioridad (Alta):** es el riesgo alto del plan («Calificación de reseña»), el fallo es simple de corregir y afecta a todos los usuarios.

**Contraste adicional:** `rating = -1` (caso `CR-00`) sí responde 400. Solo el 0 se acepta, lo que apunta a una comparación del límite inferior.
**Adjuntar:** captura de la respuesta de Postman (código HTTP y `x-request-id`) y el extracto de `reporte_integracion.txt`.

---

## D-09 · Un comentario con lenguaje inapropiado se acepta

**Proyecto:** TicketU · Reseñas · **Categoría:** API · Validación de contenido
**Severidad:** Media · **Prioridad:** Media · **Reproducibilidad:** 1 de 1 (con la frase de la prueba; ver pendiente)
**Caso vinculado:** TestLink C-04 «Comentario con lenguaje inapropiado» · Newman `CR-07`
**Referencia:** HU-RES-01, «Un comentario con lenguaje inapropiado responde 422».

**Pasos para reproducir**
1. Login de beto en `POST /api/auth/login`; copiar `token`.
2. Dejar a beto sin reseña en un evento terminado con su check-in (el Taller express).
3. `POST /api/reviews/reviews` con `Authorization: Bearer <token>` y body `{"eventId": "<id del evento>", "rating": 4, "comment": "esto es una mierda de evento"}`.

**Resultado esperado:** `422` y la reseña no se publica.
**Resultado obtenido:** `201 Created` (691 B). La reseña quedó publicada y hubo que eliminarla (`CR-09c`, 200).

**Justificación de severidad (Media):** incumple una regla de contenido, pero no corrompe datos ni impide usar el servicio. **Prioridad (Media):** el riesgo asociado a la descripción es bajo en el plan, y la corrección depende de la lista de palabras que use el filtro.

**Pendiente antes de reportar:** probar a mano 2 o 3 variantes (otra grosería, con mayúsculas y con tildes) y anotar cuál se rechaza y cuál no. Eso permite precisar si el filtro tiene una lista corta o si no actúa. Si ninguna se rechaza, la severidad sigue siendo Media.
**Nota:** la primera ejecución (18:45:37) dio 409 por D-06; con la limpieza de la colección actual quedó evaluado.

---

## Desalineaciones de contrato (D-01 a D-05)

La implementación se comprobó con la ejecución; el YAML del equipo (`docs/swagger-api/API de Reseñas.yaml`) se revisó en la Entrega 1.

- **D-01** Ruta: el Swagger usa `/resenas`; lo implementado es `/api/reviews/reviews`, `/api/reviews/events/<id>`, `/api/reviews/pending` y `/api/reviews/mine`. En la ejecución del 06-11-2026, `POST /api/resenas` respondió **404**.
- **D-02** Largo del comentario: el Swagger dice 1000 y la HU dice 500. En la ejecución, 501 caracteres → 400 y 500 → 201.
- **D-03** Descripción: el Swagger la exige; en la ejecución, una reseña sin comentario → 201.
- **D-04** Identidad: el Swagger pide `id_usuario` en el body, y el sistema toma el usuario del token. Falta mostrar con un caso que el sistema ignore un `id_usuario` ajeno.
- **D-05** Modificar: el Swagger define `PUT`; las HU implementadas solo permiten ver y eliminar.

Acción para los cinco: actualizar el YAML a lo implementado. Son tareas de corrección del documento del equipo, no defectos del sistema.

## Hallazgos descartados o a verificar
- **D-07 (descartado):** un evento publicado que aún no termina responde **422** (I2-01). El evento cancelado queda sin evaluar (caso C-03 bloqueado: no hay un evento cancelado en el ambiente).
- **D-08 (por verificar):** el listado refleja la eliminación (I4-03), pero no se comprobó que el promedio se recalcule. La carpeta M de la colección lo prueba (2 reseñas, se elimina una y se revisa el promedio) en cuanto haya un evento con asistencia de beto y ana.
- **Eliminar como organizador:** los dos organizadores (`cealumnos@` y `deportes@`) recibieron 403 en `CR-16` y `CR-16b`. Es el comportamiento de la HU-RES-03 («solo el autor o un admin»), así que se ajusta el caso 07 de la Entrega 1 y no se reporta como defecto.

## Plantilla Mantis
```
Resumen:
Proyecto: TicketU · Reseñas      Categoría: API
Severidad: ____   Prioridad: ____   Reproducibilidad: ____
Pasos para reproducir:
Resultado esperado (HU / regla):
Resultado obtenido (HTTP + mensaje):
x-request-id:
Adjuntos:
Caso TestLink / Newman vinculado:
```
