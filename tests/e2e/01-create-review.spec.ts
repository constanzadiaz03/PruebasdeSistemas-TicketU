import { test, expect, apiGetReviewsSummary, apiCreateReview, apiDeleteReview, apiGetPendingReviews, API_BASE } from '../fixtures/test-fixtures';
import { REVIEW_TEST_DATA, TEST_USERS } from '../utils/api-client';

/**
 * Flujo 1: Ver eventos pendientes de reseña y crear una reseña via UI
 * Cubre: HU-RES-01 (crear reseña), HU-RES-02 (ver pública)
 */
test.describe('Flujo E2E 1: Ver pendientes y crear reseña via UI', () => {
  test('beto ve eventos pendientes y crea una reseña', async ({
    authenticatedPage,
    reviewsPage,
    request,
    betoTokens,
  }) => {
    // 1. Verificar que hay eventos pendientes
    const pending = await apiGetPendingReviews(request, betoTokens.token);
    if (pending.length === 0) {
      test.skip(true, 'No hay eventos pendientes para crear reseña');
    }
    await reviewsPage.expectPendingEventsGreaterThan(0);

    // 2. Obtener el primer evento pendiente via API
    const firstEvent = pending[0];
    const eventId = firstEvent.eventId;
    const eventTitle = firstEvent.title;

    // 3. Verificar que el evento aparece en la lista "Por reseñar"
    await reviewsPage.expectEventInPending(eventTitle);

    // 4. Abrir formulario de reseña
    await reviewsPage.openReviewForm(eventTitle);

    // 5. Llenar y enviar reseña
    await reviewsPage.selectRating(REVIEW_TEST_DATA.valid.rating);
    await reviewsPage.fillComment(REVIEW_TEST_DATA.valid.comment);
    await reviewsPage.submitReview();

    // 6. Esperar y recargar
    await authenticatedPage.waitForTimeout(2000);
    await authenticatedPage.reload();
    await authenticatedPage.waitForLoadState('networkidle');
    await authenticatedPage.locator('[data-testid="my-review"]').first().waitFor({ state: 'visible', timeout: 15000 });

    // 7. Verificar que la reseña aparece en "Mis reseñas"
    await reviewsPage.expectMyReviewsGreaterThan(0);

    // 8. Verificar en lista pública del evento
    const summary = await apiGetReviewsSummary(request, eventId);
    expect(summary.count).toBeGreaterThanOrEqual(1);

    await reviewsPage.gotoEvent(eventId);
    await reviewsPage.expectPublicReviewsSummary({
      count: summary.count,
      minAverage: 1,
      maxAverage: 5,
      hasDistribution: true,
      reviewCount: summary.count,
    });
  });
});

/**
 * Flujo 2: Eliminar una reseña propia y verificar que desaparece
 * Cubre: HU-RES-03 "Solo el autor puede eliminar una reseña"
 */
test.describe('Flujo E2E 2: Autor elimina su reseña', () => {
  test('beto crea y luego elimina su reseña', async ({
    authenticatedPage,
    reviewsPage,
    request,
    betoTokens,
  }) => {
    // 1. Crear una reseña primero (usar un evento pendiente)
    const pending = await apiGetPendingReviews(request, betoTokens.token);
    if (pending.length === 0) {
      test.skip(true, 'No hay eventos pendientes para crear reseña');
    }
    const eventId = pending[0].eventId;
    const eventTitle = pending[0].title;

    await reviewsPage.openReviewForm(eventTitle);
    await reviewsPage.selectRating(3);
    await reviewsPage.fillComment('Reseña para test de eliminación');
    await reviewsPage.submitReview();

    await authenticatedPage.waitForTimeout(2000);
    await authenticatedPage.reload();
    await authenticatedPage.waitForLoadState('networkidle');
    await authenticatedPage.locator('[data-testid="my-review"]').first().waitFor({ state: 'visible', timeout: 15000 });

    // 2. Verificar estado inicial - al menos 1 reseña
    await reviewsPage.expectMyReviewsGreaterThan(0);
    const initialCount = await reviewsPage.myReviewCards.count();

    // 3. Eliminar la primera reseña
    await reviewsPage.deleteMyReview(0);

    // 4. Recargar y verificar que disminuyó
    await authenticatedPage.reload();
    await authenticatedPage.waitForLoadState('networkidle');
    // Si quedan reseñas, esperar a que carguen
    const remainingCount = await reviewsPage.myReviewCards.count();
    if (remainingCount > 0) {
      await authenticatedPage.locator('[data-testid="my-review"]').first().waitFor({ state: 'visible', timeout: 15000 });
    }

    const newCount = await reviewsPage.myReviewCards.count();
    expect(newCount).toBe(initialCount - 1);
  });
});

/**
 * Flujo 3: Valores límite de calificación via API
 * Cubre: HU-RES-01 rating 1 y 5 se aceptan
 */
test.describe('Flujo E2E 3: Valores límite de calificación (API)', () => {
  test('rating 1 (mínimo) se acepta via API', async ({
    request,
    betoTokens,
  }) => {
    // Buscar un evento pendiente para reseñar
    const pending = await apiGetPendingReviews(request, betoTokens.token);
    if (pending.length === 0) {
      test.skip(true, 'No hay eventos pendientes para crear reseña');
    }
    const eventId = pending[0].eventId || pending[0].id || pending[0]._id;

    const result = await apiCreateReview(request, betoTokens.token, {
      eventId: eventId,
      rating: REVIEW_TEST_DATA.minRating.rating,
      comment: REVIEW_TEST_DATA.minRating.comment,
    });
    expect(result.id).toBeTruthy();
    expect(result.rating).toBe(1);
    // Limpiar
    await apiDeleteReview(request, betoTokens.token, result.id);
  });

  test('rating 5 (máximo) se acepta via API', async ({
    request,
    betoTokens,
  }) => {
    // Buscar un evento pendiente para reseñar (usar uno diferente)
    const pending = await apiGetPendingReviews(request, betoTokens.token);
    if (pending.length < 2) {
      test.skip(true, 'No hay suficientes eventos pendientes');
    }
    const eventId = pending[1].eventId || pending[1].id || pending[1]._id;

    const result = await apiCreateReview(request, betoTokens.token, {
      eventId: eventId,
      rating: REVIEW_TEST_DATA.maxRating.rating,
      comment: REVIEW_TEST_DATA.maxRating.comment,
    });
    expect(result.id).toBeTruthy();
    expect(result.rating).toBe(5);
    // Limpiar
    await apiDeleteReview(request, betoTokens.token, result.id);
  });
});

/**
 * Flujo 4: Comentario opcional/vacío via API
 * Cubre: HU-RES-01 "Comentario opcional"
 */
test.describe('Flujo E2E 4: Comentario opcional (API)', () => {
  test('reseña sin comentario se acepta', async ({
    request,
    betoTokens,
  }) => {
    // Buscar un evento pendiente para reseñar
    const pending = await apiGetPendingReviews(request, betoTokens.token);
    if (pending.length === 0) {
      test.skip(true, 'No hay eventos pendientes para crear reseña');
    }
    const eventId = pending[0].eventId || pending[0].id || pending[0]._id;

    const result = await apiCreateReview(request, betoTokens.token, {
      eventId: eventId,
      rating: 3,
      // Sin comment
    });
    expect(result.id).toBeTruthy();
    // API puede devolver null o string vacío
    expect(result.comment === null || result.comment === '').toBeTruthy();
    await apiDeleteReview(request, betoTokens.token, result.id);
  });

  test('reseña con comentario vacío se acepta', async ({
    request,
    betoTokens,
  }) => {
    // Buscar un evento pendiente para reseñar
    const pending = await apiGetPendingReviews(request, betoTokens.token);
    if (pending.length === 0) {
      test.skip(true, 'No hay eventos pendientes para crear reseña');
    }
    const eventId = pending[0].eventId || pending[0].id || pending[0]._id;

    const result = await apiCreateReview(request, betoTokens.token, {
      eventId: eventId,
      rating: 3,
      comment: '',
    });
    expect(result.id).toBeTruthy();
    expect(result.comment).toBe('');
    await apiDeleteReview(request, betoTokens.token, result.id);
  });
});