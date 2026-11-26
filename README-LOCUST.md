# Pruebas No Funcionales - Locust (Entrega 3)

Pruebas de **carga** y **estrés** para el flujo de **compra de entradas** de TicketU.

## 🎯 Flujo Probado

```
Login (Auth) → Catálogo (Catálogo) → Disponibilidad (Entradas)
    → Crear Orden (Entradas) → Resumen Pago (Pagos) → Pagar (Pagos)
    → Ver Entradas/QR (Entradas)
```

**Servicios involucrados:** Auth (1), Catálogo (2), Entradas (3), Pagos (4)

---

## 📋 Escenarios de Prueba

| Escenario | Usuarios | Spawn Rate | Duración | Objetivo |
|-----------|----------|------------|----------|----------|
| **Carga Normal** | 50 | 5/s | 5 min | Validar rendimiento bajo carga esperada |
| **Estrés (Pico)** | 100 | 10/s | 3 min | Encontrar punto de ruptura |
| **Soak (Estabilidad)** | 30 | 3/s | 30 min | Detectar memory leaks, degradación |

---

## 🚀 Instalación

```bash
cd PS-E3
pip install -r requirements-locust.txt
```

> **Nota**: Requiere Python 3.9+

---

## 🏃 Ejecución

### Opción 1: Scripts predefinidos (recomendado)

```bash
# Carga normal (50 usuarios, 5 min)
python locustfile.py carga

# Estrés (100 usuarios, 3 min)
python locustfile.py estres

# Soak test (30 usuarios, 30 min)
python locustfile.py soak
```

Genera:
- `locust-report-<escenario>.html` - Reporte visual
- `locust-<escenario>_stats.csv` - Métricas agregadas
- `locust-<escenario>_failures.csv` - Errores
- `locust-<escenario>_history.csv` - Historial temporal

### Opción 2: UI Web interactiva

```bash
locust -f locustfile.py
```
Abrir `http://localhost:8089` en navegador.

### Opción 3: Línea de comandos personalizada

```bash
# Carga: 30 usuarios, 2 min
locust -f locustfile.py --headless -u 30 -r 3 -t 2m --html report.html --csv results

# Estrés: 80 usuarios, 2 min
locust -f locustfile.py --headless -u 80 -r 8 -t 2m --html report-stress.html --csv results-stress
```

---

## 📊 Umbrales de Aceptación (Configurables en `locustfile.py`)

```python
THRESHOLDS = {
    "carga": {
        "p95_ms": 500,           # P95 ≤ 500ms
        "error_rate_pct": 1.0,   # Error rate ≤ 1%
        "min_rps": 50,           # Throughput ≥ 50 RPS
    },
    "estres": {
        "p95_ms": 2000,          # P95 ≤ 2000ms (degradado aceptable)
        "error_rate_pct": 5.0,   # Error rate ≤ 5%
        "min_rps": 20,           # Throughput ≥ 20 RPS
    }
}
```

**Ajustar según la estrategia de pruebas definida en Entrega 1.**

---

## 📈 Métricas Capturadas

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
✅ EVALUACIÓN VS UMBRALES:

   CARGA:
      P95 ≤ 500ms:     ✅ PASS (actual: 342ms)
      Error Rate ≤ 1%: ✅ PASS (actual: 0.23%)
      RPS ≥ 50:        ✅ PASS (actual: 67.3)
      RESULTADO:       ✅ CUMPLE

   ESTRES:
      P95 ≤ 2000ms:    ✅ PASS (actual: 1205ms)
      Error Rate ≤ 5%: ❌ FAIL (actual: 6.8%)
      RPS ≥ 20:        ✅ PASS (actual: 34.1)
      RESULTADO:       ❌ NO CUMPLE
```

### En el reporte HTML (`locust-report-*.html`):

- **Statistics**: Tabla con todas las métricas por endpoint
- **Charts**: Gráficos de RPS, latencia, errores en el tiempo
- **Failures**: Lista de errores con traza
- **Download Data**: CSVs para análisis externo

---

## 📝 Entregables para la Entrega 3

1. **Documento de Diseño de Prueba** (este README + `locustfile.py`)
2. **Resultados de Carga**: `locust-report-carga.html` + CSVs
3. **Resultados de Estrés**: `locust-report-estres.html` + CSVs
4. **Interpretación**: Análisis escrito comparando métricas vs umbrales
5. **Conclusiones**: Cuellos de botella, recomendaciones

---

## 🐛 Solución de Problemas

| Problema | Solución |
|----------|----------|
| `Connection refused` | Verificar que `BASE_URL` en locustfile.py sea accesible |
| `Login failed` | Verificar credenciales en `TEST_USERS` y que usuarios existan |
| `No valid events` | Verificar que hay eventos publicados en catálogo |
| `Payment failed` | En ambiente de pruebas, pagos $0 usan `payment_method: "free"` |
| `ModuleNotFoundError: locust` | `pip install -r requirements-locust.txt` |

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
Modificar `THRESHOLDS` al inicio del archivo.

---

## 📚 Referencias

- [Locust Documentation](https://docs.locust.io/)
- [Locust Best Practices](https://docs.locust.io/en/stable/best-practices.html)
- [Interpreting Results](https://docs.locust.io/en/stable/analyzing-results.html)