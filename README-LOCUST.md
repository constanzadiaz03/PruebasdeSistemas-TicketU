# Pruebas No Funcionales - Locust (Entrega 3)

Pruebas de **carga**, **estrés** y **resistencia (soak)** para el flujo de **compra de entradas** de TicketU.

## 🎯 Flujo Probado

```
Login (Auth) → Catálogo (Catálogo) → Disponibilidad (Entradas)
    → Crear Orden (Entradas) → Resumen Pago (Pagos) → Pagar (Pagos)
    → Ver Entradas/QR (Entradas)
```

**Servicios involucrados:** Auth (1), Catálogo (2), Entradas (3), Pagos (4)

---

## 📋 Escenarios de Prueba (Retest 2026-11-26)

> **Nota:** Los parámetros se ajustaron al retest real ejecutado el 2026-11-26 (ver `locustfile.py` líneas 488-493 para valores por defecto del script CLI).

| Escenario | Usuarios | Spawn Rate | Duración | Objetivo | Comando CLI |
|-----------|----------|------------|----------|----------|-------------|
| **Carga Normal** | 15 | 3/s | 3 min | Validar rendimiento bajo carga esperada inicio operación | `python locustfile.py carga`* |
| **Estrés** | 20 | 3/s | 3 min | Identificar punto de quiebre y medir recuperación | `python locustfile.py estres`* |
| **Soak (Resistencia)** | 10 | 2/s | 5 min | Detectar memory leaks, degradación progresiva | `python locustfile.py soak`* |

> *Los comandos CLI usan valores por defecto distintos (50/100/30 usuarios). Para replicar el retest exacto, usar Opción 3 (línea de comandos personalizada) o modificar `ESCENARIOS` en `locustfile.py`.

---

## 🚀 Instalación

```bash
pip install -r requirements-locust.txt
```

> **Nota**: Requiere Python 3.9+

---

## 🏃 Ejecución

### Opción 1: Scripts predefinidos (valores por defecto del script)

```bash
# Carga normal (50 usuarios, 5 min) - valor por defecto del script
python locustfile.py carga

# Estrés (100 usuarios, 3 min) - valor por defecto del script
python locustfile.py estres

# Soak test (30 usuarios, 30 min) - valor por defecto del script
python locustfile.py soak
```

Genera reportes en `locust/<escenario>/<timestamp>/`:
- `reporte-<escenario>.html` - Reporte visual
- `<escenario>_stats.csv` - Métricas agregadas
- `<escenario>_failures.csv` - Errores
- `<escenario>_history.csv` - Historial temporal

### Opción 2: UI Web interactiva

```bash
locust -f locustfile.py
```
Abrir `http://localhost:8089` en navegador.

### Opción 3: Línea de comandos personalizada (replicar retest exacto)

```bash
# Carga Normal: 15 usuarios, 3/s, 3 min (retest 2026-11-26)
locust -f locustfile.py --headless -u 15 -r 3 -t 3m --html locust-report-carga.html --csv locust-carga

# Estrés: 20 usuarios, 3/s, 3 min (retest 2026-11-26)
locust -f locustfile.py --headless -u 20 -r 3 -t 3m --html locust-report-estres.html --csv locust-estres

# Soak: 10 usuarios, 2/s, 5 min (retest 2026-11-26)
locust -f locustfile.py --headless -u 10 -r 2 -t 5m --html locust-report-soak.html --csv locust-soak
```

---

## 📊 Umbrales de Aceptación (Configurables en `locustfile.py`)

```python
THRESHOLDS = {
    "carga": {
        "p95_ms": 500,           # P95 ≤ 500ms
        "error_rate_pct": 5.0,   # Error rate ≤ 5% (incluye 409 esperados)
        "min_rps": 5,            # Throughput ≥ 5 RPS
    },
    "estres": {
        "p95_ms": 2000,          # P95 ≤ 2000ms (degradado aceptable)
        "error_rate_pct": 10.0,  # Error rate ≤ 10% (incluye 409 esperados)
        "min_rps": 3,            # Throughput ≥ 3 RPS
    }
}
```

> **Nota importante**: Los errores **409 Conflict** (lógica de negocio: evento iniciado, límite 4 entradas, agotado) son **esperados** y no indican fallas del sistema. Se incluyen en el error rate global pero el error real efectivo es ~0%.

**Ajustar según la estrategia de pruebas definida en Entrega 1.**

---

## 📈 Resultados del Retest 2026-11-26

| Escenario | Usuarios | Duración | P95 Latencia | Error Rate* | RPS | Cumple |
|-----------|----------|----------|--------------|-------------|-----|--------|
| **Carga Normal** | 15 | 3 min | 360 ms | 5.43% (409) | 4.30 | ✅ Latencia |
| **Estrés** | 20 | 3 min | 87 ms | 7.95% (409) | 5.40 | ✅ Latencia |
| **Soak (Resistencia)** | 10 | 5 min | 35 ms | 8.26% (409) | 3.10 | ✅ Estable |

> *Error rate incluye **409 Conflict** (lógica de negocio). **Error real ≈ 0%**.

### Hallazgo Crítico: **ND-01** — Login Timeout bajo carga
- **>20 usuarios**: `POST /api/auth/login` → timeout 21s, ~5% fallos
- **Causa probable**: Connection pooling insuficiente o rate limiting en Auth
- **Impacto**: Degradación severa del servicio de autenticación
- **Recomendación**: Corregir **antes de producción**

---

## 📊 Métricas Capturadas

| Métrica | Descripción | Dónde se ve |
|---------|-------------|-------------|
| **Response Time (p50, p95, p99)** | Latencia por endpoint | Reporte HTML, CSV |
| **Requests/sec (RPS)** | Throughput global y por endpoint | Reporte HTML, CSV |
| **Error Rate** | % de requests fallidos (HTTP 4xx/5xx + excepciones) | Reporte HTML, CSV |
| **Failures Detail** | Detalle de cada error con respuesta | `*_failures.csv` |

---

## 🔍 Análisis de Resultados

### Al finalizar cada prueba, la consola muestra:

```
[METRICAS GLOBALES]:
   Total Requests:     755
   Total Failures:     41
   Error Rate:         5.43%
   Avg Response Time:  77 ms
   P95 Response Time:  360 ms
   Current RPS:        4.30

[POR ENDPOINT]:
   POST /auth/login
      Requests: 10 | Errors: 0 (0.00%) | Avg: 405ms | P95: 1400ms | RPS: 0.00
   GET /catalog/events
      Requests: 296 | Errors: 0 (0.00%) | Avg: 78ms | P95: 220ms | RPS: 1.30
   ...

[EVALUACION VS UMBRALES]:
   CARGA:
      P95 <= 500ms:     PASS (actual: 360ms)
      Error Rate <= 5%: FAIL (actual: 5.43%)  ← incluye 409 esperados
      RPS >= 5:         FAIL (actual: 4.30)   ← limitado por 2 usuarios prueba
      RESULTADO:        NO CUMPLE (por throughput y 409)

   ESTRES:
      P95 <= 2000ms:    PASS (actual: 87ms)
      Error Rate <= 10%: PASS (actual: 7.95%)
      RPS >= 3:         PASS (actual: 5.40)
      RESULTADO:        CUMPLE
```

### En el reporte HTML (`locust-report-*.html`):

- **Statistics**: Tabla con todas las métricas por endpoint
- **Charts**: Gráficos de RPS, latencia, errores en el tiempo
- **Failures**: Lista de errores con traza
- **Download Data**: CSVs para análisis externo

---

## 📝 Entregables para la Entrega 3

1. **Documento de Diseño de Prueba** (`document/Diseno_Pruebas_Rendimiento_Entrega3.docx`)
2. **Resultados de Carga**: `locust-report-carga.html` + CSVs
3. **Resultados de Estrés**: `locust-report-estres.html` + CSVs
4. **Resultados de Soak**: `locust-report-soak.html` + CSVs
5. **Interpretación**: `document/Resultados_Pruebas_Rendimiento_Entrega3.docx`
6. **Informe de Cierre**: `document/Informe_Cierre_Consolidado_Entregas2_3.docx`

---

## 🐛 Solución de Problemas

| Problema | Solución |
|----------|----------|
| `Connection refused` | Verificar que `BASE_URL` en locustfile.py sea accesible |
| `Login failed` | Verificar credenciales en `TEST_USERS` y que usuarios existan |
| `No valid events` | Verificar que hay eventos publicados en catálogo |
| `Payment failed` | En ambiente de pruebas, pagos $0 usan `payment_method: "free"` |
| `ModuleNotFoundError: locust` | `pip install -r requirements-locust.txt` |
| Throughput bajo (RPS < 5) | Esperado: ambiente solo tiene 2 usuarios de prueba (beto, ana) |

---

## 🔧 Personalización

### Agregar más usuarios de prueba
Editar `TEST_USERS` en `locustfile.py`:
```python
TEST_USERS = [
    {"email": "user1@test.cl", "password": "pass123"},
    {"email": "user2@test.cl", "password": "pass123"},
    # ... más usuarios
]
```

### Ajustar think time
En cada clase de usuario:
```python
wait_time = between(1, 3)  # min, max segundos entre requests
```

### Cambiar umbrales
Modificar `THRESHOLDS` al inicio del archivo (`locustfile.py` líneas 32-43).

### Modificar escenarios CLI por defecto
Editar diccionario `ESCENARIOS` en `locustfile.py` líneas 488-493.

---

## 📚 Referencias

- [Locust Documentation](https://docs.locust.io/)
- [Locust Best Practices](https://docs.locust.io/en/stable/best-practices.html)
- [Interpreting Results](https://docs.locust.io/en/stable/analyzing-results.html)