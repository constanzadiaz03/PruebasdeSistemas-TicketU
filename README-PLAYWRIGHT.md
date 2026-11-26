# TicketU - Reseñas - Pruebas E2E Playwright (Entrega 3)

Suite de pruebas End-to-End automatizadas con **Playwright** para el **Servicio 6: Reseñas** de TicketU.

## 📋 Cobertura de Flujos E2E (15 flujos)

| # | Archivo | Flujo | Historia | Estado |
|---|---------|-------|----------|--------|
| 1 | `01-create-review.spec.ts` | Crear reseña válida + verificar en lista pública | HU-RES-01, HU-RES-02 | ✅ |
| 2 | `01-create-review.spec.ts` | Rating mínimo (1) y máximo (5) | HU-RES-01 | ✅ |
| 3 | `02-negative-cases.spec.ts` | Estudiante sin check-in → 403 | HU-RES-01 | ✅ |
| 4 | `02-negative-cases.spec.ts` | Evento no terminado → 422 | HU-RES-01 | ✅ |
| 5 | `02-negative-cases.spec.ts` | Evento cancelado → 422 | HU-RES-01 | ✅ |
| 6 | `02-negative-cases.spec.ts` | Reseña duplicada → 409 | HU-RES-01 | ✅ |
| 7 | `02-negative-cases.spec.ts` | Ratings inválidos (0, 6, 3.5, -1, texto, null, sin rating) → 400 | HU-RES-01 | ✅ |
| 8 | `02-negative-cases.spec.ts` | Comentario > 500 chars → 400 | HU-RES-01 | ✅ |
| 9 | `02-negative-cases.spec.ts` | **Lenguaje inapropiado → 201 (Defecto D-09 activo)** | HU-RES-01 | 🔴 Bug |
| 10 | `03-manage-reviews.spec.ts` | Autor elimina reseña → desaparece de listas | HU-RES-03 | ✅ |
| 11 | `03-manage-reviews.spec.ts` | Otro usuario elimina reseña ajena → 403 | HU-RES-03 | ✅ |
| 12 | `03-manage-reviews.spec.ts` | Organizador elimina reseña → 403 | HU-RES-03 | ✅ |
| 13 | `03-manage-reviews.spec.ts` | Sin autenticación → 401 (API + UI) | HU-RES-03 | ✅ |
| 14 | `03-manage-reviews.spec.ts` | Evento sin reseñas → mensaje "sin reseñas" | HU-RES-02 | ✅ |
| 15 | `03-manage-reviews.spec.ts` | Evento con reseñas → count, avg, distribución, orden | HU-RES-02 | ✅ |
| 16 | `03-manage-reviews.spec.ts` | Comentario vacío/opcional se acepta | HU-RES-01 | ✅ |

> **Total: 16 flujos** (mínimo requerido: 6)

---

## 🚀 Instalación y Ejecución

### Prerrequisitos
- **Node.js ≥ 20** (verificar con `node --version`)
- **npm** (incluido con Node.js)

### Instalación
```bash
cd PS-E3
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
# Solo flujos de creación
npx playwright test 01-create-review.spec.ts

# Solo casos negativos
npx playwright test 02-negative-cases.spec.ts

# Solo gestión de reseñas
npx playwright test 03-manage-reviews.spec.ts

# Un test específico
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

| Usuario | Email | Password | Rol | Descripción |
|---------|-------|----------|-----|-------------|
| **Beto** | `beto@ticketu.cl` | `Ticketu2026` | `student` | Tiene check-in en eventos terminados |
| **Ana** | `ana@ticketu.cl` | `Ticketu2026` | `student` | Sin check-in |
| **Org 1** | `cealumnos@ticketu.cl` | `Ticketu2026` | `organizer` | Organizador principal |
| **Org 2** | `deportes@ticketu.cl` | `Ticketu2026` | `organizer` | Segundo organizador |

---

## 📁 Estructura del Proyecto

```
PS-E3/
├── package.json              # Dependencias y scripts
├── playwright.config.ts      # Configuración Playwright
├── tsconfig.json             # Configuración TypeScript
├── README.md                 # Este archivo
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
│       ├── 01-create-review.spec.ts      # Flujos 1-2: Crear reseña
│       ├── 02-negative-cases.spec.ts     # Flujos 3-9: Casos negativos
│       └── 03-manage-reviews.spec.ts     # Flujos 10-16: Gestión reseñas
├── playwright-report/        # Reporte HTML (generado)
└── test-results/             # Resultados JSON/JUnit (generados)
```

---

## 🔧 Configuración Avanzada

### Variables de entorno (opcional)
Crear archivo `.env` en `PS-E3/`:
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

---

## 🐛 Defectos Conocidos (Entrega 3)

| ID | Descripción | Severidad | Estado |
|----|-------------|-----------|--------|
| **D-09** | Comentario con lenguaje inapropiado se acepta (201) en lugar de rechazar (422) | Minor | **Activo** - Documentado en `02-negative-cases.spec.ts` |
| D-08 | Promedio no se recalcula al eliminar reseña | - | Por verificar |

---

## 📝 Notas para la Entrega

1. **TestLink**: Registrar los 16 flujos como casos de prueba en TestLink
2. **Mantis**: 
   - Retest D-09 con evidencia de Playwright (este test falla intencionalmente documentando el bug)
   - Retest D-08
   - Reportar nuevos defectos encontrados
3. **Evidencia**: Capturas de pantalla y videos en `test-results/` tras ejecución
4. **Presentación**: Incluir demo de 2-3 flujos clave

---

## 🤝 Contribuidores

Grupo QA 6 - Prueba de Sistemas (CIN 421 / INF 423) - Universidad de Valparaíso