import { test as base, Page, APIRequestContext } from '@playwright/test';
import { TEST_USERS, AuthTokens } from '../utils/api-client';
import { LoginPage } from '../pages/login.page';
import { ReviewsPage } from '../pages/reviews.page';
import { EventDetailPage } from '../pages/event-detail.page';

const API_BASE = 'https://pruebasdesistemauv.com/ticketu/api';

interface TestFixtures {
  loginPage: LoginPage;
  reviewsPage: ReviewsPage;
  eventDetailPage: EventDetailPage;
  authenticatedPage: Page;
  betoTokens: AuthTokens;
  anaTokens: AuthTokens;
  organizadorTokens: AuthTokens;
  testEventId: string;
}

// Helper functions using the request fixture directly
async function apiLogin(request: APIRequestContext, email: string, password: string): Promise<AuthTokens> {
  const response = await request.post(`${API_BASE}/auth/login`, {
    data: { email, password },
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok()) {
    throw new Error(`Login failed: ${response.status()} - ${await response.text()}`);
  }
  const data = await response.json();
  return { token: data.token, user: data.user };
}

async function apiGetReviewsSummary(request: APIRequestContext, eventId: string, token?: string) {
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const response = await request.get(`${API_BASE}/reviews/events/${eventId}`, { headers });
  if (!response.ok()) throw new Error(`Failed: ${response.status()}`);
  return response.json();
}

async function apiGetPendingReviews(request: APIRequestContext, token: string) {
  const response = await request.get(`${API_BASE}/reviews/pending`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!response.ok()) throw new Error(`Failed: ${response.status()}`);
  return response.json();
}

async function apiCreateReview(request: APIRequestContext, token: string, review: { eventId: string; rating: number; comment?: string }) {
  const response = await request.post(`${API_BASE}/reviews/reviews`, {
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    data: review,
  });
  const data = await response.json();
  if (!response.ok()) throw new Error(`Create failed: ${response.status()} - ${data.message || JSON.stringify(data)}`);
  return data;
}

async function apiDeleteReview(request: APIRequestContext, token: string, reviewId: string) {
  const response = await request.delete(`${API_BASE}/reviews/reviews/${reviewId}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!response.ok() && response.status() !== 404) {
    const data = await response.json();
    throw new Error(`Delete failed: ${response.status()} - ${data.message || JSON.stringify(data)}`);
  }
}

export const test = base.extend<TestFixtures>({
  // Page objects
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  reviewsPage: async ({ page }, use) => {
    await use(new ReviewsPage(page));
  },

  eventDetailPage: async ({ page }, use) => {
    await use(new EventDetailPage(page));
  },

  // Autenticación previa para beto (estudiante con check-in)
  betoTokens: async ({ request }, use) => {
    const tokens = await apiLogin(request, TEST_USERS.beto.email, TEST_USERS.beto.password);
    await use(tokens);
  },

  // Autenticación previa para ana (estudiante sin check-in)
  anaTokens: async ({ request }, use) => {
    const tokens = await apiLogin(request, TEST_USERS.ana.email, TEST_USERS.ana.password);
    await use(tokens);
  },

  // Autenticación para organizador
  organizadorTokens: async ({ request }, use) => {
    const tokens = await apiLogin(request, TEST_USERS.organizador1.email, TEST_USERS.organizador1.password);
    await use(tokens);
  },

  // Página ya autenticada como beto - hace login real via UI
  authenticatedPage: async ({ page, loginPage }, use) => {
    await loginPage.goto();
    await loginPage.login(TEST_USERS.beto.email, TEST_USERS.beto.password);
    await loginPage.expectLoginSuccess();
    // Navegar a reviews y esperar a que cargue
    await page.goto('https://pruebasdesistemauv.com/ticketu/#/reviews');
    await page.waitForLoadState('networkidle');
    // Esperar a que la página renderice (puede que no haya reseñas aún)
    await page.waitForTimeout(2000);
    await use(page);
  },

  // ID de evento de prueba (se resuelve dinámicamente via API)
  testEventId: async ({ request, betoTokens }, use) => {
    // Primero buscar en mis reseñas para usar un evento que beto ya reseñó
    // así podemos ver la lista pública con al menos una reseña
    const myReviews = await request.get(`${API_BASE}/reviews/mine`, {
      headers: { 'Authorization': `Bearer ${betoTokens.token}` },
    });
    if (myReviews.ok()) {
      const reviews = await myReviews.json();
      if (reviews.length > 0) {
        const eventId = reviews[0].eventId;
        if (eventId) {
          await use(eventId);
          return;
        }
      }
    }
    // Fallback: intentar con eventos pendientes
    const pending = await apiGetPendingReviews(request, betoTokens.token);
    if (pending.length > 0) {
      const firstEvent = pending[0];
      const eventId = firstEvent.eventId || firstEvent.id || firstEvent._id;
      if (eventId) {
        await use(eventId);
        return;
      }
    }
    // Fallback: evento conocido
    await use('c47c4a17-60fc-4374-8cb6-2576b85c5017');
  },
});

// Exportar helpers para uso en tests
export { apiGetReviewsSummary, apiGetPendingReviews, apiCreateReview, apiDeleteReview, API_BASE };

export { expect } from '@playwright/test';