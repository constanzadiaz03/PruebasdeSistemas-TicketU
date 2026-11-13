# TicketU · Pruebas de Integración y Sistema — Servicio 6: Reseñas (`/api/reviews`)

Suite automatizada de pruebas de API, contratos e integración entre microservicios para el **Servicio 6: Reseñas** de la plataforma **TicketU**, desarrollada por el **Grupo QA 6** en el marco de la asignatura **Prueba de Sistemas (CIN 421 / INF 423)** de la **Universidad de Valparaíso**.

* **Ambiente bajo prueba:** `https://pruebasdesistemauv.com/ticketu`
* **Estado de servicios:** `https://pruebasdesistemauv.com/ticketu/api/health`
* **Contratos OpenAPI (Swagger):** `https://pruebasdesistemauv.com/ticketu/api/docs/`
* **Gestor de defectos (Mantis):** `https://mantis.pruebasdesistemauv.com`

---

## Arquitectura y alcance bajo prueba

TicketU opera bajo una arquitectura de **9 microservicios desacoplados** expuestos a través de un único **API Gateway** (`/ticketu/api/<servicio>`) y coordinados mediante un **broker interno de eventos** (`event.published`, `event.cancelled`, `ticket.checked_in`, `review.created`).

El **Servicio 6 (`Reseñas`)** implementa las historias de usuario `HU-RES-01`, `HU-RES-02` y `HU-RES-03`, interactuando de forma asíncrona con **Auth**, **Catálogo**, **Check-in** y **Panel Organizador**.

### Endpoints cubiertos (`/ticketu/api/reviews`)

| Método | Endpoint | Autenticación | Descripción | Códigos HTTP esperados |
|---|---|---|---|---|
| `POST` | `/api/reviews/reviews` | Bearer JWT (`student`) | Crea una reseña (nota entera `1..5`, comentario opcional `<= 500` caracteres) para un evento terminado con check-in | `201`, `400`, `401`, `403`, `404`, `409`, `422` |
| `GET` | `/api/reviews/events/:eventId` | Pública | Obtiene cantidad de reseñas, promedio (1 decimal), distribución `1..5` estrellas y listado ordenado de más reciente a más antigua | `200`, `404` |
| `GET` | `/api/reviews/pending` | Bearer JWT | Lista los eventos terminados a los que asistió el usuario y aún no reseña | `200`, `401` |
| `GET` | `/api/reviews/mine` | Bearer JWT | Lista las reseñas publicadas por el usuario autenticado | `200`, `401` |
| `DELETE` | `/api/reviews/reviews/:id` | Bearer JWT (`autor` o `admin`) | Elimina una reseña existente | `200` / `204`, `401`, `403`, `404` |

---

## Estructura del repositorio

```text
├── TicketU_Resenas_Integracion_G6.postman_collection.json   # Colección Postman/Newman (73 requests, 103 assertions)
├── ejecutar_postman.bat                                     # Script de ejecución automatizada en Windows
├── reporte_integracion.txt                                  # Log de salida de la última ejecución con Newman
├── Reporte_Defectos_Resenas_G6_Entrega2.md                  # Informe de defectos, análisis de contrato y plantilla Mantis
└── docs/                                                    # Documentos relevantes del sistema