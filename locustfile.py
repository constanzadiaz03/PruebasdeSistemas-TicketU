"""
Pruebas de Carga y Estrés - TicketU Flujo de Compra de Entradas
Entrega 3 - Pruebas No Funcionales (Locust)

Flujo probado: Login → Catálogo → Disponibilidad → Reserva/Compra → Pago
Usuarios objetivo: Estudiantes comprando entradas
"""

import random
import time
from locust import HttpUser, task, between, events
from locust.exception import RescheduleTask

# ============================================================
# CONFIGURACIÓN
# ============================================================

BASE_URL = "https://pruebasdesistemauv.com/ticketu/api"
TICKETS_BASE_URL = "https://pruebasdesistemauv.com/ticketu/api/tickets"
PAYMENTS_BASE_URL = "https://pruebasdesistemauv.com/ticketu/api/payments"

# Usuarios de prueba (del ambiente)
TEST_USERS = [
    {"email": "beto@ticketu.cl", "password": "Ticketu2026"},
    {"email": "ana@ticketu.cl", "password": "Ticketu2026"},
    # Agregar más usuarios si están disponibles
]

# Umbrales de aceptación (ajustar según estrategia de pruebas)
# Nota: Los errores 409 (conflictos de negocio: evento iniciado, límite entradas, agotado)
# son esperados y no indican fallas del sistema. Se excluyen del cálculo de error rate efectivo.
THRESHOLDS = {
    "carga": {
        "p95_ms": 500,
        "error_rate_pct": 5.0,  # Incluye 409 esperados
        "min_rps": 5,
    },
    "estres": {
        "p95_ms": 2000,
        "error_rate_pct": 10.0,  # Incluye 409 esperados
        "min_rps": 3,
    }
}

# ============================================================
# CLIENTE API PARA FLUJO DE COMPRA
# ============================================================

class TicketUApiClient:
    """Cliente para interactuar con la API de TicketU en el flujo de compra"""

    def __init__(self, client, base_url=BASE_URL, tickets_base_url=TICKETS_BASE_URL, payments_base_url=PAYMENTS_BASE_URL):
        self.client = client
        self.base_url = base_url
        self.tickets_base_url = tickets_base_url
        self.payments_base_url = payments_base_url
        self.token = None
        self.user_data = None

    def login(self, email: str, password: str) -> bool:
        """Iniciar sesión y obtener token JWT"""
        with self.client.post(
            f"{self.base_url}/auth/login",
            json={"email": email, "password": password},
            catch_response=True,
            name="POST /auth/login"
        ) as response:
            if response.status_code == 200:
                data = response.json()
                self.token = data.get("token")
                self.user_data = data.get("user")
                response.success()
                return True
            else:
                response.failure(f"Login failed: {response.status_code} - {response.text}")
                return False

    def get_auth_headers(self) -> dict:
        """Headers con autorización"""
        if not self.token:
            raise RescheduleTask("No token available")
        return {"Authorization": f"Bearer {self.token}", "Content-Type": "application/json"}

    def get_catalog_events(self, page_size=20, include_past=False):
        """Obtener eventos del catálogo"""
        params = {"pageSize": page_size}
        if include_past:
            params["includePast"] = "true"

        with self.client.get(
            f"{self.base_url}/catalog/events",
            params=params,
            headers=self.get_auth_headers(),
            catch_response=True,
            name="GET /catalog/events"
        ) as response:
            if response.status_code == 200:
                response.success()
                return response.json()
            else:
                response.failure(f"Catalog failed: {response.status_code}")
                return None

    def get_event_detail(self, event_id: str):
        """Obtener detalle de un evento"""
        with self.client.get(
            f"{self.base_url}/catalog/events/{event_id}",
            headers=self.get_auth_headers(),
            catch_response=True,
            name="GET /catalog/events/:id"
        ) as response:
            if response.status_code == 200:
                response.success()
                return response.json()
            else:
                response.failure(f"Event detail failed: {response.status_code}")
                return None

    def check_availability(self, event_id: str, quantity: int = 1):
        """Consultar disponibilidad (Equipo 3 - Entradas)"""
        with self.client.get(
            f"{self.tickets_base_url}/availability/{event_id}",
            params={"quantity": quantity},
            headers=self.get_auth_headers(),
            catch_response=True,
            name="GET /tickets/availability/:id"
        ) as response:
            if response.status_code == 200:
                response.success()
                return response.json()
            else:
                response.failure(f"Availability failed: {response.status_code}")
                return None

    def create_order(self, event_id: str, quantity: int = 1):
        """Crear orden de reserva/compra (Equipo 3 - Entradas)"""
        with self.client.post(
            f"{self.tickets_base_url}/orders",
            json={"eventId": event_id, "quantity": quantity},
            headers=self.get_auth_headers(),
            catch_response=True,
            name="POST /tickets/orders"
        ) as response:
            if response.status_code in (200, 201):
                response.success()
                return response.json()
            else:
                response.failure(f"Create order failed: {response.status_code} - {response.text}")
                return None

    def get_payment_summary(self, order_id: str):
        """Obtener resumen de pago (Equipo 4 - Pagos)"""
        with self.client.get(
            f"{self.payments_base_url}/orders/{order_id}",
            headers=self.get_auth_headers(),
            catch_response=True,
            name="GET /payments/orders/:id"
        ) as response:
            if response.status_code == 200:
                response.success()
                return response.json()
            else:
                response.failure(f"Payment summary failed: {response.status_code}")
                return None

    def process_payment(self, order_id: str, payment_method: str = "card", card_number: str = "4242424242424242"):
        """Procesar pago (Equipo 4 - Pagos)"""
        # Tarjetas de prueba según la especificación:
        # 4242424242424242 - válida (aprobada)
        # 4000000000000002 - fondos insuficientes
        # 4000000000009995 - bloqueada
        # 4000000000000119 - error del procesador

        import datetime
        exp_month = 12
        exp_year = datetime.datetime.now().year + 2

        with self.client.post(
            f"{self.payments_base_url}/checkout",
            json={
                "orderId": order_id,
                "card": {
                    "number": card_number,
                    "holder": "TEST USER",
                    "expMonth": exp_month,
                    "expYear": exp_year,
                    "cvv": "123"
                }
            },
            headers=self.get_auth_headers(),
            catch_response=True,
            name="POST /payments/checkout"
        ) as response:
            if response.status_code in (200, 201):
                response.success()
                return response.json()
            else:
                response.failure(f"Payment failed: {response.status_code} - {response.text}")
                return None

    def get_my_tickets(self):
        """Obtener mis entradas con QR (Equipo 3)"""
        with self.client.get(
            f"{self.tickets_base_url}/tickets",
            headers=self.get_auth_headers(),
            catch_response=True,
            name="GET /tickets/tickets"
        ) as response:
            if response.status_code == 200:
                response.success()
                return response.json()
            else:
                response.failure(f"My tickets failed: {response.status_code}")
                return None


# ============================================================
# USUARIO LOCUST - FLUJO COMPLETO DE COMPRA
# ============================================================

class TicketUBuyer(HttpUser):
    """
    Usuario que simula el flujo completo de compra:
    1. Login
    2. Navegar catálogo
    3. Ver detalle de evento
    4. Consultar disponibilidad
    5. Crear orden
    6. Pagar
    7. Ver entradas
    """

    wait_time = between(2, 5)  # Tiempo de espera entre tareas (simula think time)
    abstract = True  # No instanciar directamente, usar subclases

    def on_start(self):
        """Ejecutado al inicio de cada usuario virtual"""
        self.api = TicketUApiClient(self.client)
        self.authenticated = False
        self.current_event_id = None
        self.current_order_id = None

        # Login con usuario aleatorio
        user = random.choice(TEST_USERS)
        self.authenticated = self.api.login(user["email"], user["password"])

        if not self.authenticated:
            raise RescheduleTask("Login failed")

        # Cargar catálogo para tener eventos disponibles
        self.load_catalog()

    def load_catalog(self):
        """Cargar catálogo de eventos"""
        catalog = self.api.get_catalog_events(page_size=50, include_past=True)
        if catalog:
            # Extraer eventos según estructura de respuesta
            events = catalog.get("items") or catalog.get("events") or catalog.get("data") or []
            if events:
                # Filtrar eventos publicados y no cancelados
                valid_events = [
                    e for e in events
                    if e.get("status") == "published" and not e.get("cancelled", False)
                ]
                if valid_events:
                    self.available_events = valid_events
                    return

        raise RescheduleTask("No valid events in catalog")

    @task(3)
    def browse_catalog(self):
        """Navegar catálogo - tarea frecuente"""
        self.api.get_catalog_events(page_size=20)

    @task(2)
    def view_event_detail(self):
        """Ver detalle de evento aleatorio"""
        if not hasattr(self, 'available_events') or not self.available_events:
            self.load_catalog()
            return

        event = random.choice(self.available_events)
        event_id = event.get("id") or event.get("eventId") or event.get("_id")
        if event_id:
            self.api.get_event_detail(event_id)
            self.current_event_id = event_id

    @task(2)
    def check_availability(self):
        """Consultar disponibilidad de entrada"""
        if not self.current_event_id:
            self.view_event_detail()
            if not self.current_event_id:
                return

        qty = random.randint(1, 3)
        self.api.check_availability(self.current_event_id, qty)

    @task(1)
    def create_and_pay_order(self):
        """Flujo completo: crear orden + pagar"""
        if not self.current_event_id:
            self.view_event_detail()
            if not self.current_event_id:
                return

        # 1. Crear orden (reserva)
        qty = random.randint(1, 2)
        order = self.api.create_order(self.current_event_id, qty)
        if not order:
            return

        self.current_order_id = order.get("id") or order.get("orderId") or order.get("_id")
        if not self.current_order_id:
            return

        # 2. Ver resumen de pago
        summary = self.api.get_payment_summary(self.current_order_id)
        if not summary:
            return

        # 3. Procesar pago (usar tarjeta de prueba)
        # Nota: En ambiente de pruebas puede que no requiera tarjeta real
        total = summary.get("total", 0)
        if total == 0:
            # Evento gratis - pago automático
            payment_method = "free"
            card_token = None
        else:
            payment_method = "card"
            card_token = "tok_visa"  # Token de prueba Stripe

        payment = self.api.process_payment(
            self.current_order_id,
            payment_method=payment_method,
            card_token=card_token
        )

        if payment:
            # 4. Ver mis entradas
            self.api.get_my_tickets()

        # Reset para próxima iteración
        self.current_order_id = None


# ============================================================
# CLASES PARA DIFERENTES ESCENARIOS
# ============================================================

class CargaNormalUser(TicketUBuyer):
    """
    ESCENARIO CARGA NORMAL
    Usuarios concurrentes normales comprando entradas
    Objetivo: Validar rendimiento bajo carga esperada
    """
    host = BASE_URL
    weight = 3  # Más usuarios de este tipo


class CargaPicoUser(TicketUBuyer):
    """
    ESCENARIO CARGA PICO
    Más agresivo, menos think time
    """
    host = BASE_URL
    wait_time = between(0.5, 2)
    weight = 1


class SoloLecturaUser(HttpUser):
    """
    USUARIO SOLO LECTURA (Catálogo, Detalle, Disponibilidad)
    Simula visitantes navegando sin comprar
    """
    host = BASE_URL
    wait_time = between(1, 3)
    weight = 2

    def on_start(self):
        self.api = TicketUApiClient(self.client)

    @task(5)
    def browse_catalog(self):
        self.api.get_catalog_events(page_size=20, include_past=False)

    @task(3)
    def view_event_detail(self):
        catalog = self.api.get_catalog_events(page_size=50)
        if catalog:
            events = catalog.get("items") or catalog.get("events") or catalog.get("data") or []
            if events:
                event = random.choice(events)
                event_id = event.get("id") or event.get("eventId")
                if event_id:
                    self.api.get_event_detail(event_id)

    @task(2)
    def check_availability(self):
        catalog = self.api.get_catalog_events(page_size=50)
        if catalog:
            events = catalog.get("items") or catalog.get("events") or catalog.get("data") or []
            if events:
                event = random.choice(events)
                event_id = event.get("id") or event.get("eventId")
                if event_id:
                    self.api.check_availability(event_id, 1)


# ============================================================
# EVENTOS Y REPORTES PERSONALIZADOS
# ============================================================

@events.test_start.add_listener
def on_test_start(environment, **kwargs):
    print("\n" + "="*60)
    print("INICIANDO PRUEBAS DE CARGA - TICKETU COMPRA ENTRADAS")
    print("="*60)
    print(f"Host: {BASE_URL}")
    print(f"Usuarios de prueba: {len(TEST_USERS)}")
    print("="*60 + "\n")


@events.test_stop.add_listener
def on_test_stop(environment, **kwargs):
    print("\n" + "="*60)
    print("PRUEBAS FINALIZADAS - GENERANDO RESUMEN")
    print("="*60)

    # Obtener estadísticas
    stats = environment.stats

    # Métricas globales
    total_requests = stats.total.num_requests
    total_failures = stats.total.num_failures
    error_rate = (total_failures / total_requests * 100) if total_requests > 0 else 0
    avg_response_time = stats.total.avg_response_time
    p95_response_time = stats.total.get_response_time_percentile(0.95)
    current_rps = stats.total.current_rps

    print(f"\n[METRICAS GLOBALES]:")
    print(f"   Total Requests:     {total_requests:,}")
    print(f"   Total Failures:     {total_failures:,}")
    print(f"   Error Rate:         {error_rate:.2f}%")
    print(f"   Avg Response Time:  {avg_response_time:.0f} ms")
    print(f"   P95 Response Time:  {p95_response_time:.0f} ms")
    print(f"   Current RPS:        {current_rps:.2f}")

    # Por endpoint
    print(f"\n[POR ENDPOINT]:")
    for name, entry in stats.entries.items():
        if entry.num_requests > 0:
            ep_error_rate = (entry.num_failures / entry.num_requests * 100)
            ep_p95 = entry.get_response_time_percentile(0.95)
            print(f"   {entry.method} {name}")
            print(f"      Requests: {entry.num_requests:,} | Errors: {entry.num_failures:,} ({ep_error_rate:.2f}%) | Avg: {entry.avg_response_time:.0f}ms | P95: {ep_p95:.0f}ms | RPS: {entry.current_rps:.2f}")

    # Evaluación vs umbrales
    print(f"\n[EVALUACION VS UMBRALES]:")
    for scenario, thresholds in THRESHOLDS.items():
        print(f"\n   {scenario.upper()}:")
        p95_ok = p95_response_time <= thresholds["p95_ms"]
        error_ok = error_rate <= thresholds["error_rate_pct"]
        rps_ok = current_rps >= thresholds["min_rps"]

        print(f"      P95 <= {thresholds['p95_ms']}ms:     {'PASS' if p95_ok else 'FAIL'} (actual: {p95_response_time:.0f}ms)")
        print(f"      Error Rate <= {thresholds['error_rate_pct']}%:  {'PASS' if error_ok else 'FAIL'} (actual: {error_rate:.2f}%)")
        print(f"      RPS >= {thresholds['min_rps']}:         {'PASS' if rps_ok else 'FAIL'} (actual: {current_rps:.2f})")

        overall = p95_ok and error_ok and rps_ok
        print(f"      RESULTADO:         {'CUMPLE' if overall else 'NO CUMPLE'}")

    print("\n" + "="*60)


# ============================================================
# EJECUCIÓN DESDE LÍNEA DE COMANDOS
# ============================================================

if __name__ == "__main__":
    import os
    import sys
    import subprocess
    from datetime import datetime

    # Permitir ejecutar directamente: python locustfile.py [carga|estres|soak]
    ESCENARIOS = {
        # modo: (usuarios, spawn rate, duración)
        "carga":  ("50",  "5",  "5m"),
        "estres": ("100", "10", "3m"),
        "soak":   ("30",  "3",  "30m"),
    }

    if len(sys.argv) > 1:
        mode = sys.argv[1].lower()

        if mode not in ESCENARIOS:
            print("Uso: python locustfile.py [carga|estres|soak]")
            sys.exit(1)

        users, spawn_rate, duration = ESCENARIOS[mode]

        # Carpeta: locust/<tipo>/<fecha-hora>/
        stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
        output_dir = os.path.join("locust", mode, stamp)
        os.makedirs(output_dir, exist_ok=True)

        cmd = [
            "locust", "-f", __file__,
            "--headless",
            "-u", users,
            "-r", spawn_rate,
            "-t", duration,
            "--html", os.path.join(output_dir, f"reporte-{mode}.html"),
            "--csv", os.path.join(output_dir, mode),   # prefijo de los CSV
        ]

        print(f"Reportes en: {output_dir}")
        print(f"Ejecutando: {' '.join(cmd)}")
        subprocess.run(cmd)
    else:
        print("Uso: python locustfile.py [carga|estres|soak]")
        print("  o ejecuta: locust -f locustfile.py (para UI web)")