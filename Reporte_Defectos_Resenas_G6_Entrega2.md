# Reporte de defectos · Reseñas (Grupo QA 6) · Entrega 2

**Servicio:** 6 · Reseñas (`/api/reviews`) · **Ambiente:** https://pruebasdesistemauv.com/ticketu  
**Evidencia actual:** `reporte_integracion.txt` — Ejecución del **12-11-2026 20:59:17** (Newman: **73 requests**, **103 assertions**, **2 fallidas** correspondientes a **1 defecto activo**; duración `7.3s`, tiempo promedio `17ms`).  
**Evidencia histórica:** Ejecuciones del **10-11-2026** (`18:45:37` y `19:10:29`; 51 requests, 78 assertions, 4 fallidas correspondientes a 2 defectos).

> **Regla aplicada:** Si el sistema incumple una HU implementada, es **defecto**; si el caso esperaba otra regla que la implementada, se **ajusta el caso**.

---
> **Criterio de clasificación:** En la Entrega 1 se diseñaron artefactos sobre otro sistema bajo prueba (`docs/swagger-api/API de Reseñas.yaml`); para la Entrega 2 el sistema bajo prueba cambió a **TicketU** (`https://pruebasdesistemauv.com/ticketu`), cuyo contrato oficial está publicado en `/ticketu/api/docs/`. Por ello:
> * Si el sistema incumple una HU implementada de TicketU, es **defecto del sistema** (se reporta en Mantis).
> * Si un caso o artefacto heredado de la Entrega 1 esperaba la estructura del sistema anterior, corresponde a un **ajuste de migración** (se actualiza el caso/artefacto y no se reporta como defecto).

---

## Resumen de hallazgos

| ID | Resumen | Tipo | Severidad (Mantis) | Prioridad | Caso vinculado | Estado |
|---|---|---|---|---|---|---|
| D-01 | Rutas de Entrega 1 (`/resenas`) vs. rutas de TicketU (`/api/reviews/...`) | Ajuste Entrega 1 | — | — | Colección 1.ª ejecución, CT-03 | Ajustado a TicketU |
| D-02 | Largo de comentario: 1000 en Entrega 1 vs. 500 en TicketU (`HU-RES-01`) | Ajuste Entrega 1 | — | — | TestLink ext 11 · CR-06, CR-18 | Ajustado a TicketU |
| D-03 | Comentario obligatorio (`descripcion`) en Entrega 1 vs. opcional (`comment`) en TicketU | Ajuste Entrega 1 | — | — | TestLink ext 6 · CR-14, CR-26 | Ajustado a TicketU |
| D-04 | `id_usuario` en body (Entrega 1) vs. autenticación por token JWT en TicketU | Ajuste Entrega 1 | — | — | I5-01, I5-02 | Ajustado a TicketU |
| D-05 | Método `PUT` definido en Entrega 1 vs. solo crear/listar/eliminar en TicketU | Ajuste Entrega 1 | — | — | TestLink ext 74 (retirado) | Caso retirado |
| D-06 | La calificación `0` se aceptaba como válida (`201`) | Sistema | Alta (`Major`) | Alta | TestLink ext 3 · CR-01 | **Resuelto / Cerrado** (12-11-2026) |
| **D-09** | **Un comentario con lenguaje inapropiado se acepta (`201`)** | **Sistema** | **Media (`Minor`)** | **Media** | **TestLink C-04 · CR-07** | **Confirmado (Activo)** |
| D-07 | Evento aún no terminado | Sistema | — | — | I2-01 | **Descartado** (responde `422`) |
| D-08 | El promedio no se recalcula al eliminar una reseña | Sistema | — | — | TestLink ext 306/307 · CR-15, M-05 | **Por verificar** (`M` skipped) |
---
