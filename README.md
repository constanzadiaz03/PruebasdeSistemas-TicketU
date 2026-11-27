# TicketU — Entrega 3 (Pruebas E2E, Carga y Cierre)

**Grupo QA 6** — Prueba de Sistemas (CIN 421 / INF 423) — Universidad de Valparaíso

> **Rama actual**: `entrega-3` | **Ambiente**: `https://pruebasdesistemauv.com/ticketu`

---

## Integrantes

- Vicente Cruces
- Gabriel Del Castilo
- Constanza Díaz
- Bruno González
- Franko Moraga
- Rodrigo Pino

## 📌 Resumen de la Entrega

Esta rama consolida la **Entrega 3** del proyecto TicketU, que incluye:

| Componente                              | Herramienta            | Alcance                            | Estado                                               |
| --------------------------------------- | ---------------------- | ---------------------------------- | ---------------------------------------------------- |
| **Pruebas E2E Automatizadas**     | Playwright             | 16 flujos — Servicio 6 (Reseñas) | ✅ 59 passed (2 proyectos), 7 skipped* (ND-02), 2 failed (ND-01 timeout) |
| **Pruebas de Carga/Estrés/Soak** | Locust                 | 3 escenarios — Flujo Compra E2E   | ✅ Cumple latencia, Throughput limitado por ambiente |
| **Retesting Defectos Entrega 2**  | Mantis + Playwright    | D-06, D-07, D-08, D-09             | ✅ 3 verificados, 1 descartado por tiempo            |
| **Informe de Cierre Consolidado** | Docx (plantilla profe) | Entregas 2 + 3                     | ✅ Generado                                          |

> *7 tests skipped: Usuario `beto` sin eventos pendientes de reseña (ND-02). Tests ejecutados en 2 proyectos (paralelo + serial) para manejo de estado compartido. 2 failed: ND-01 timeouts ambientales (red/login), no bugs de test.

---

## 🏗 Estructura del Repositorio

```
PS-E2/                                    # Raíz del proyecto (rama entrega-3)
├── .github/workflows/                    # CI/CD (Playwright + Locust)
├── document/                             # 📄 ENTREGABLES OFICIALES (plantilla profe)
│   ├── Diseno_Pruebas_Rendimiento_Entrega3.docx
│   ├── Resultados_Pruebas_Rendimiento_Entrega3.docx
│   ├── Informe_Cierre_Consolidado_Entregas2_3.docx
│   ├── Presentacion_Entrega3_Grupo6.pptx
│   └── templates/                          # Plantillas originales de la profe
│       ├── Plantilla_Diseno_Pruebas_Performance_CIN421.docx
│       ├── Plantilla_Resultados_Pruebas_Performance_CIN421.docx
│       ├── Plantilla_Informe_Cierre_Pruebas_CIN421.docx
│       ├── Plantilla_Presentacion_Cierre_CIN421.pptx
│       ├── Correcciones y mejoras aplicadas al sitio.docx
│       └── Rubrica_Entrega3_CIN421_Alumnos.pdf
├── locust/                                 # 📁 Reportes y datos Locust (generados)
│   ├── locust-report-carga-final.html
│   ├── locust-report-estres-final.html
│   ├── locust-report-soak-final.html
│   └── *.csv
├── playwright/                             # 📁 Capturas y debug Playwright
├── playwright-report/                      # 📁 Reporte HTML Playwright (generado)
├── test-results/                           # 📁 Resultados JSON/JUnit + videos
├── tests/                                  # 🎭 SUITE PLAYWRIGHT (E2E)
│   ├── e2e/
│   │   ├── 01-create-review.spec.ts        # Flujos 1-4: Crear reseña
│   │   ├── 02-negative-cases.spec.ts       # Flujos 5-11: Casos negativos
│   │   └── 03-manage-reviews.spec.ts       # Flujos 12-16: Gestión reseñas
│   ├── fixtures/test-fixtures.ts           # Fixtures: auth, pages, API client
│   ├── pages/
│   │   ├── login.page.ts
│   │   ├── reviews.page.ts
│   │   └── event-detail.page.ts
│   └── utils/api-client.ts                 # Cliente API + test data + users
├── locustfile.py                           # 🐛 SUITE LOCUST (Carga/Estrés/Soak)
├── requirements-locust.txt                 # Python deps: locust==2.31.0
├── package.json                            # Node.js deps: Playwright, TS, ESLint
├── playwright.config.ts                    # Config Playwright
├── tsconfig.json                           # Config TypeScript
├── README-LOCUST.md                        # Docs detalladas Locust
├── README-PLAYWRIGHT.md                    # Docs detalladas Playwright
└── .gitignore
```

---

## 🚀 Inicio Rápido

### Prerrequisitos

| Herramienta       | Versión   | Verificar            |
| ----------------- | ---------- | -------------------- |
| **Node.js** | ≥ 20      | `node --version`   |
| **npm**     | (incluido) | `npm --version`    |
| **Python**  | ≥ 3.9     | `python --version` |
| **pip**     | (incluido) | `pip --version`    |

### 1. Pruebas E2E (Playwright) — Servicio 6: Reseñas

```bash
# Instalar dependencias
npm ci
npm run install:browsers

# Ejecutar todas las pruebas (headless)
npm test

# Con interfaz gráfica
npm run test:headed

# UI interactiva de Playwright
npm run test:ui

# Ver reporte HTML tras ejecución
npm run test:report
```

**Suites individuales:**

```bash
npx playwright test 01-create-review.spec.ts   # Crear reseña
npx playwright test 02-negative-cases.spec.ts  # Casos negativos
npx playwright test 03-manage-reviews.spec.ts  # Gestión reseñas
```

### 2. Pruebas No Funcionales (Locust) — Flujo Compra E2E

```bash
# Instalar dependencias Python
pip install -r requirements-locust.txt

# Scripts predefinidos (recomendado)
python locustfile.py carga      # 15 usuarios, 3 min, 3/s spawn
python locustfile.py estres     # 20 usuarios, 3 min, 3/s spawn
python locustfile.py soak       # 10 usuarios, 5 min, 2/s spawn

# UI Web interactiva
locust -f locustfile.py
# Abrir http://localhost:8089
```

**Genera:** `locust-report-<escenario>.html` + CSVs en `locust/`

---

## 🎯 Flujo de Compra Probado (Locust)

```
POST /api/auth/login
    → GET /api/catalog/events
    → GET /api/catalog/events/:id
    → GET /api/tickets/availability/:eventId
    → POST /api/tickets/orders
    → GET /api/payments/orders/:orderId
    → POST /api/payments/checkout
    → GET /api/tickets/tickets
```

**Servicios involucrados:** Auth (1), Catálogo (2), Entradas (3), Pagos (4)

---

## 📊 Métricas Clave (Retest 2026-11-26)

| Escenario                    | Usuarios | Duración | P95 Latencia | Error Rate* | RPS  | Cumple      |
| ---------------------------- | -------- | --------- | ------------ | ----------- | ---- | ----------- |
| **Carga Normal**       | 15       | 3 min     | 360 ms       | 5.43% (409) | 4.30 | ✅ Latencia |
| **Estrés**            | 20       | 3 min     | 87 ms        | 7.95% (409) | 5.40 | ✅ Latencia |
| **Soak (Resistencia)** | 10       | 5 min     | 35 ms        | 8.26% (409) | 3.10 | ✅ Estable  |

> *Error rate incluye **409 Conflict** (lógica de negocio: evento iniciado, límite 4 entradas, agotado). **Error real ≈ 0%**.

### Hallazgo Crítico: **ND-01** — Login Timeout bajo carga

- **>20 usuarios**: `POST /api/auth/login` → timeout 21s, ~5% fallos
- **Causa probable**: Connection pooling insuficiente o rate limiting en Auth
- **Impacto**: Degradación severa del servicio de autenticación
- **Recomendación**: Corregir **antes de producción**

---

## 🧪 Cobertura E2E (Playwright) — 16 Flujos

| #   | Flujo                                                  | HU             | Archivo               | Estado |
| --- | ------------------------------------------------------ | -------------- | --------------------- | ------ |
| 1   | Ver pendientes + crear reseña via UI                  | RES-01, RES-02 | `01-create-review`  | ✅     |
| 2   | Autor elimina su reseña                               | RES-03         | `01-create-review`  | ✅     |
| 3-4 | Rating 1 (mín) y 5 (máx) via API                     | RES-01         | `01-create-review`  | ✅     |
| 5-6 | Comentario opcional/vacío via API                     | RES-01         | `01-create-review`  | ✅     |
| 7   | Estudiante sin check-in → 403                         | RES-01         | `02-negative-cases` | ✅     |
| 8   | Evento no terminado → 422/403                         | RES-01         | `02-negative-cases` | ✅     |
| 9   | Evento cancelado → 422                                | RES-RES-01     | `02-negative-cases` | ✅     |
| 10  | Reseña duplicada → 409                               | RES-01         | `02-negative-cases` | ✅     |
| 11  | Ratings inválidos → 400                              | RES-01         | `02-negative-cases` | ✅     |
| 12  | Comentario >500 chars → 400                           | RES-01         | `02-negative-cases` | ✅     |
| 13  | **Lenguaje inapropiado → 422 (D-09 corregido)** | RES-01         | `02-negative-cases` | ✅     |
| 14  | Autor elimina reseña (E2E completo)                   | RES-03         | `03-manage-reviews` | ✅     |
| 15  | No autor elimina reseña ajena → 403                  | RES-03         | `03-manage-reviews` | ✅     |
| 16  | Organizador elimina reseña → 403                     | RES-03         | `03-manage-reviews` | ✅     |
| 17  | Sin auth → 401 (API + UI)                             | RES-03         | `03-manage-reviews` | ✅     |
| 18  | Evento sin reseñas → mensaje                         | RES-02         | `03-manage-reviews` | ✅     |
| 19  | Evento con reseñas → resumen correcto                | RES-02         | `03-manage-reviews` | ✅     |
| 20  | Comentario opcional (API)                              | RES-01         | `03-manage-reviews` | ✅     |

> **Total: 16 flujos automatizados** (mínimo requerido: 6) → **34 tests Playwright × 2 proyectos = 68 ejecuciones**
> **Resultado**: 59 passed, 7 skipped (ND-02), 2 failed (ND-01 timeout ambiental)

---

## 🐛 Defectos — Trazabilidad Entrega 2 → 3

| ID             | Descripción                         | Entrega 2        | Retest Entrega 3                                                 | Acción Mantis                     |
| -------------- | ------------------------------------ | ---------------- | ---------------------------------------------------------------- | ---------------------------------- |
| **D-06** | Rating 0 se aceptaba (201)           | Resuelto         | ✅ Confirmado 400                                                | **Cerrado**                  |
| **D-07** | Evento no terminado                  | Descartado (422) | ✅ Confirmado 422                                                | **Cerrado**                  |
| **D-08** | Promedio no se recalcula al eliminar | Por verificar    | ✅ **Funciona** (count 3→2, avg 3.7→3.5)                 | **No reproducible / Cerrar** |
| **D-09** | Lenguaje inapropiado se acepta (201) | Activo           | ✅ **Confirmado 422** (test pasa retest) — Backend ya corrige | **No gestionar (ya corregido)** |

### Defectos Nuevos (Entrega 3)

| ID              | Título                             | Severidad         | Descripción                                        |
| --------------- | ----------------------------------- | ----------------- | --------------------------------------------------- |
| **ND-01** | Login timeout bajo carga alta       | **Media**   | >20 users: login 21s timeout, ~5% fallos (afecta Locust; Playwright timeout extendido a 30s) |
| **ND-02** | Usuario beto sin eventos pendientes | Baja              | **7 tests skipped** (reducido de 18 con fix `testEventId`; tests en 2 proyectos para manejo estado) |
| **ND-03** | Falta mensaje "Sin reseñas" en UI  | Baja (Cosmético) | Sección "Mis reseñas" vacía sin data-testid      |

---

## 📄 Entregables Oficiales (document/)

Todos los `.docx`/`.pptx` siguen **exactamente la estructura de las plantillas de la profe**:

| Archivo                                          | Plantilla                                           | Descripción                                                                                                   |
| ------------------------------------------------ | --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `Diseno_Pruebas_Rendimiento_Entrega3.docx`     | `Plantilla_Diseno_Pruebas_Performance_CIN421`     | Diseño: 3 escenarios (Carga, Estrés, Resistencia), criterios P9, monitoreo, ambiente, costo, estimación     |
| `Resultados_Pruebas_Rendimiento_Entrega3.docx` | `Plantilla_Resultados_Pruebas_Performance_CIN421` | Resultados por petición, evidencia, comparación iteraciones, interpretación, defectos, conclusiones, anexos |
| `Informe_Cierre_Consolidado_Entregas2_3.docx`  | `Plantilla_Informe_Cierre_Pruebas_CIN421`         | Ejecutivo + antecedentes + resultados específicos + lecciones + riesgos + acuerdos                            |
| `Presentacion_Entrega3_Grupo6.pptx`            | `Plantilla_Presentacion_Cierre_CIN421`            | Presentación de cierre (diapositivas)                                                                         |

---

## 🔗 Enlaces de Ambiente

| Componente                  | URL                                                   |
| --------------------------- | ----------------------------------------------------- |
| **Frontend TicketU**  | `https://pruebasdesistemauv.com/ticketu/#/`         |
| **API Base**          | `https://pruebasdesistemauv.com/ticketu/api`        |
| **Health Check**      | `https://pruebasdesistemauv.com/ticketu/api/health` |
| **Swagger/OpenAPI**   | `https://pruebasdesistemauv.com/ticketu/api/docs/`  |
| **Mantis (Defectos)** | `https://mantis.pruebasdesistemauv.com`             |
| **TestLink**          | `[enlace TestLink del proyecto]`                    |

---

## 👥 Usuarios de Prueba

| Usuario         | Email                    | Password        | Rol           | Notas                                                           |
| --------------- | ------------------------ | --------------- | ------------- | --------------------------------------------------------------- |
| **Beto**  | `beto@ticketu.cl`      | `Ticketu2026` | `student`   | **Tiene check-in** — eventos pendientes agotados (ND-02) |
| **Ana**   | `ana@ticketu.cl`       | `Ticketu2026` | `student`   | Sin check-in — para casos negativos                            |
| **Org 1** | `cealumnos@ticketu.cl` | `Ticketu2026` | `organizer` | Organizador principal                                           |
| **Org 2** | `deportes@ticketu.cl`  | `Ticketu2026` | `organizer` | Segundo organizador                                             |
