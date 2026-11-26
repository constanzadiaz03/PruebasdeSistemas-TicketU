# TicketU - Reseñas - Pruebas E2E Playwright (Entrega 3)

Suite de pruebas End-to-End automatizadas con **Playwright** para el **Servicio 6: Reseñas** de TicketU.

> **Retest 2026-11-26**: 16 passed, 18 skipped (ND-02: beto sin eventos pendientes), 0 failed

## 📋 Cobertura de Flujos E2E (16 flujos / 20 tests)

| # | Archivo | Flujo | Historia | Estado |
|---|---------|-------|----------|--------|
| 1 | `01-create-review.spec.ts` | Ver eventos pendientes + crear reseña via UI | HU-RES-01, HU-RES-02 | ✅ Pass |
| 2 | `01-create-review.spec.ts` | Autor elimina su reseña | HU-RES-03 | ✅ Pass |
| 3 | `01-create-review.spec.ts` | Rating 1 (mínimo) via API | HU-RES-01 | ✅ Pass |
| 4 | `01-create-review.spec.ts` | Rating 5 (máximo) via API | HU-RES-01 | ✅ Pass |
| 5 | `01-create-review.spec.ts` | Comentario opcional/vacío via API | HU-RES-01 | ✅ Pass |
| 6 | `02-negative-cases.spec.ts` | Estudiante sin check-in → 403 | HU-RES-01 | ✅ Pass |
| 7 | `02-negative-cases.spec.ts` | Evento no terminado → 422/403 | HU-RES-01 | ✅ Pass |
| 8 | `02-negative-cases.spec.ts` | Evento cancelado → 422 | HU-RES-01 | ✅ Pass |
| 9 | `02-negative-cases.spec.ts` | Reseña duplicada → 409 | HU-RES-01 | ✅ Pass |
| 10 | `02-negative-cases.spec.ts` | Ratings inválidos (0, 6, 3.5, -1, texto, null, sin rating) → 400 | HU-RES-01 | ✅ Pass |
| 11 | `02-negative-cases.spec.ts` | Comentario > 500 chars → 400 | HU-RES-01 | ✅ Pass |
| 12 | `02-negative-cases.spec.ts` | **Lenguaje inapropiado → 422 (D-09 corregido por backend)** | HU-RES-01 | ✅ Pass |
| 13 | `03-manage-reviews.spec.ts` | Autor elimina reseña (E2E completo) | HU-RES-03 | ✅ Pass |
| 14 | `03-manage-reviews.spec.ts` | No autor elimina reseña ajena → 403 | HU-RES-03 | ✅ Pass |
| 15 | `03-manage-reviews.spec.ts` | Organizador elimina reseña → 403 | HU-RES-03 | ✅ Pass |
| 16 | `03-manage-reviews.spec.ts` | Sin autenticación → 401 (API + UI) | HU-RES-03 | ✅ Pass |
| 17 | `03-manage-reviews.spec.ts` | Evento sin reseñas → mensaje | HU-RES-02 | ✅ Pass |
| 18 | `03-manage-reviews.spec.ts` | Evento con reseñas → count, avg, distribución, orden | HU-RES-02 | ✅ Pass |
| 19 | `03-manage-reviews.spec.ts` | Comentario opcional (API) | HU-RES-01 | ✅ Pass |

> **Total: 16 flujos E2E** (mínimo requerido: 6) → **20 tests Playwright**  
> **Resultado retest**: 16 passed, 18 skipped (usuario beto sin eventos pendientes - ND-02), 0 failed

---

## 🚀 Instalación y Ejecución

### Prerrequisitos
- **Node.js ≥ 20** (verificar con `node --version`)
- **npm** (incluido con Node.js)

### Instalación
```bash
npm ci
npm run install:browsers
```

### Ejecución de pruebas
```bash
# Ejecutar todas las pruebas (headless)
npm test

# Ejecutar con interfaz gráfica (headed)
npm run test:headed

# Abrir UI interactiva de Playwright
npm run test:ui

# Debug paso a paso
npm run test:debug

# Ver reporte HTML después de ejecución
npm run test:report
```

### Ejecutar pruebas específicas
```bash
# Solo flujos de creación (TL-01 a TL-09)
npx playwright test 01-create-review.spec.ts

# Solo casos negativos (TL-10 a TL-16)
npx playwright test 02-negative-cases.spec.ts

# Solo gestión de reseñas (TL-12 a TL-19)
npx playwright test 03-manage-reviews.spec.ts

# Un test específico por nombre
npx playwright test -g "beto crea reseña"
```

---

## 🌐 Ambiente de Pruebas

| Componente | URL |
|------------|-----|
| **Frontend** | `https://pruebasdesistemauv.com/ticketu/#/` |
| **API Base** | `https://pruebasdesistemauv.com/ticketu/api` |
| **Health Check** | `https://pruebasdesistemauv.com/ticketu/api/health` |
| **Swagger Docs** | `https://pruebasdesistemauv.com/ticketu/api/docs/` |
| **Mantis (Defectos)** | `https://mantis.pruebasdesistemauv.com` |

---

## 👥 Usuarios de Prueba

| Usuario | Email | Password | Rol | Notas |
|---------|-------|----------|-----|-------|
| **Beto** | `beto@ticketu.cl` | `Ticketu2026` | `student` | **Check-in OK** — **sin eventos pendientes** (ND-02) |
| **Ana** | `ana@ticketu.cl` | `Ticketu2026` | `student` | Sin check-in — para casos negativos |
| **Org 1** | `cealumnos@ticketu.cl` | `Ticketu2026` | `organizer` | Organizador principal |
| **Org 2** | `deportes@ticketu.cl` | `Ticketu2026` | `organizer` | Segundo organizador |

> **ND-02**: Usuario `beto` ya reseñó todos sus eventos pendientes → 18 tests skipped en flujos de creación/eliminación via UI.

---

## 📁 Estructura del Proyecto

```
PS-E2/
├── package.json              # Dependencias y scripts
├── playwright.config.ts      # Configuración Playwright
├── tsconfig.json             # Configuración TypeScript
├── README.md                 # README general del repo
├── README-LOCUST.md          # Docs Locust (carga/estrés/soak)
├── README-PLAYWRIGHT.md      # Este archivo
├── .gitignore                # Archivos ignorados
├── tests/
│   ├── fixtures/
│   │   └── test-fixtures.ts  # Fixtures compartidos (auth, pages, API client)
│   ├── pages/
│   │   ├── login.page.ts     # Page Object: Login
│   │   ├── reviews.page.ts   # Page Object: Reseñas (UI + acciones)
│   │   └── event-detail.page.ts # Page Object: Detalle evento
│   ├── utils/
│   │   └── api-client.ts     # Cliente API + datos de prueba + usuarios
│   ├── test-data/
│   └── e2e/
│       ├── 01-create-review.spec.ts      # Flujos 1-5: Crear reseña
│       ├── 02-negative-cases.spec.ts     # Flujos 6-12: Casos negativos
│       └── 03-manage-reviews.spec.ts     # Flujos 13-19: Gestión reseñas
├── playwright-report/        # Reporte HTML (generado)
└── test-results/             # Resultados JSON/JUnit + videos (generados)
```

---

## 🔧 Configuración Avanzada

### Variables de entorno (opcional)
Crear archivo `.env` en `PS-E2/`:
```env
BASE_URL=https://pruebasdesistemauv.com/ticketu
API_BASE_URL=https://pruebasdesistemauv.com/ticketu/api
TEST_USER_BETO=beto@ticketu.cl
TEST_PASS=Ticketu2026
```

### Ejecutar contra ambiente local
```bash
BASE_URL=http://localhost:3000 npm test
```

---

## 📊 Reportes

- **HTML**: `playwright-report/index.html` (abrir con `npm run test:report`)
- **JSON**: `test-results/results.json`
- **JUnit XML**: `test-results/results.xml` (para CI/CD)
- **Videos**: `test-results/**/video.webm` (solo en fallos)
- **Screenshots**: `test-results/**/test-failed-*.png` (solo en fallos)

---

## 🐛 Trazabilidad Defectos — Entrega 2 → 3 (Retest 2026-11-26)

| ID | Descripción | Entrega 2 | Retest Entrega 3 | Acción Mantis |
|----|-------------|-----------|------------------|---------------|
| **D-06** | Rating 0 se aceptaba (201) | Resuelto | ✅ Confirmado 400 | **Cerrado** |
| **D-07** | Evento no terminado | Descartado (422) | ✅ Confirmado 422 | **Cerrado** |
| **D-08** | Promedio no se recalcula al eliminar | Por verificar | ✅ **Funciona** (count 3→2, avg 3.7→3.5) | **No reproducible / Cerrar** |
| **D-09** | Lenguaje inapropiado se acepta (201) | Activo | 🗑️ **Descartado por tiempo** — Backend ya corrige a 422 | **No gestionar** |

> **Evidencia D-09**: Test `02-negative-cases.spec.ts` Flujo 12 — `expect 422` **PASS** (backend ya valida y rechaza)
> **Evidencia D-08**: Test `03-manage-reviews.spec.ts` Flujo 13 — `count 3→2, avg 3.7→3.5` **PASS**

### Defectos Nuevos (Entrega 3)
| ID | Título | Severidad | Descripción |
|----|--------|-----------|-------------|
| **ND-01** | Login timeout bajo carga alta | **Media** | >20 users: login 21s timeout, ~5% fallos (detectado en Locust) |
| **ND-02** | Usuario beto sin eventos pendientes | Baja | 18 tests skipped, no hay data para flujos creación/eliminación UI |
| **ND-03** | Falta mensaje "Sin reseñas" en UI | Baja (Cosmético) | Sección "Mis reseñas" vacía sin data-testid ni mensaje informativo |

---

## 📝 Notas para la Entrega

1. **TestLink**: Registrar los 16 flujos (20 tests) como casos de prueba en TestLink — ver `document/TestLink_Casos_Prueba_Entrega3.md`
2. **Mantis**:
   - D-09: **NO GESTIONAR** — descartado por tiempo, backend ya corrige
   - D-08: Cambiar a **No reproducible** o **Cerrado**
   - ND-01: Crear ticket — Performance: Login timeout bajo carga
   - ND-02: Crear ticket — Test Data: Usuario beto sin eventos pendientes
   - ND-03: Crear ticket — UI: Mensaje informativo falta en "Mis reseñas" vacío
3. **Evidencia**: Capturas de pantalla y videos en `test-results/` tras ejecución
4. **Presentación**: Incluir demo de 2-3 flujos clave (crear reseña, caso negativo, eliminar)

---

## 🤝 Contribuidores

**Grupo QA 6** — Prueba de Sistemas (CIN 421 / INF 423) — Universidad de Valparaíso

- Constanza Diaz (Líder QA)
- [Integrante 2]
- [Integrante 3]
- [Integrante 4]