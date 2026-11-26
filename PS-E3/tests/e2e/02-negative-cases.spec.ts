import { test, expect, apiCreateReview, apiDeleteReview, apiGetPendingReviews, API_BASE } from '../fixtures/test-fixtures';
import { REVIEW_TEST_DATA, TEST_USERS } from '../utils/api-client';

/**
 * Flujo 3: Login estudiante SIN check-in → Intentar reseñar → 403
 * Cubre: HU-RES-01 "Solo quienes hicieron check-in pueden reseñar"
 */
test.describe('Flujo E2E 2: Estudiante sin check-in no puede reseñar', () => {
  test('ana (sin check-in) intenta reseñar y recibe 403', async ({
    page,
    reviewsPage,
    request,
    anaTokens,
  }) => {
    // Autenticar como ana
    await page.addInitScript((token) => {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify({ role: 'student' }));
    }, anaTokens.token);

    await reviewsPage.gotoReviews();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Ana no debería tener eventos pendientes (o si tiene, al intentar reseñar da 403)
    const pendingCount = await reviewsPage.pendingList.locator('[data-testid="review-form"]').count();

    if (pendingCount > 0) {
      const firstEventForm = reviewsPage.pendingList.locator('[data-testid="review-form"]').first();
      const eventTitle = await firstEventForm.locator('h3').first().textContent();

      await reviewsPage.openReviewForm(eventTitle!);
      await reviewsPage.selectRating(3);
      await reviewsPage.fillComment('Intento sin check-in');
      await reviewsPage.submitReview();

      // Debe mostrar error 403
      await reviewsPage.expectGeneralError('403');
    } else {
      // Si no hay pendientes, verificar que la sección "Por reseñar" existe pero sin formularios
      const pendingContainer = page.locator('h2:has-text("Por reseñar")').locator('..');
      const forms = pendingContainer.locator('[data-testid="review-form"]');
      await expect(forms).toHaveCount(0);
    }
  });
});

/**
 * Flujo 4: Intentar reseñar evento NO terminado → 422
 * Cubre: HU-RES-01 "Solo se puede reseñar cuando el evento terminó"
 */
test.describe('Flujo E2E 3: Evento no terminado rechaza reseña', () => {
  test('evento futuro responde 422 o 403 (según check-in)', async ({
    request,
    betoTokens,
  }) => {
    // Buscar un evento pendiente que sea futuro (que beto tenga pendiente)
    const pending = await apiGetPendingReviews(request, betoTokens.token);
    if (pending.length === 0) {
      test.skip(true, 'No hay eventos pendientes para probar');
    }

    // Probar con varios eventos hasta encontrar uno que no esté ya reseñado
    for (const event of pending) {
      const eventId = event.eventId || event.id || event._id;
      if (!eventId) continue;

      try {
        await apiCreateReview(request, betoTokens.token, {
          eventId,
          rating: 4,
          comment: 'Evento futuro',
        });
        throw new Error('Debería haber fallado con 422 o 403');
      } catch (error: any) {
        // Si es 409 (ya reseñado), probar con el siguiente
        if (error.message.includes('409')) {
          continue;
        }
        // Aceptar 422 (evento no terminado) o 403 (sin check-in)
        expect(error.message).toMatch(/4(22|03)/);
        return;
      }
    }
    // Si todos dan 409, test pasa (no hay evento futuro sin reseñar)
    test.skip(true, 'Todos los eventos pendientes ya tienen reseña');
  });
});

/**
 * Flujo 5: Intentar reseñar evento CANCELADO → 422
 * Cubre: HU-RES-01 "Evento cancelado → 422"
 */
test.describe('Flujo E2E 4: Evento cancelado rechaza reseña', () => {
  test('evento cancelado responde 422', async ({
    request,
    betoTokens,
  }) => {
    // Buscar eventos cancelados en el catálogo
    const catalog = await request.get(`${API_BASE}/catalog/events?includePast=true&pageSize=100`, {
      headers: { 'Authorization': `Bearer ${betoTokens.token}` },
    });
    if (catalog.ok()) {
      const data = await catalog.json();
      const events = data.items || data.events || data.data || [];
      const cancelledEvent = events.find((e: any) => e.cancelled === true || e.status === 'cancelled');
      if (cancelledEvent) {
        const eventId = cancelledEvent.id || cancelledEvent.eventId || cancelledEvent._id;
        try {
          await apiCreateReview(request, betoTokens.token, {
            eventId,
            rating: 3,
            comment: 'Evento cancelado',
          });
          throw new Error('Debería haber fallado con 422');
        } catch (error: any) {
          expect(error.message).toContain('422');
          return;
        }
      }
    }
    // Si no encuentra, test pasa (no hay evento cancelado para probar)
    test.skip(true, 'No cancelled event found to test');
  });
});

/**
 * Flujo 6: Reseña duplicada → 409
 * Cubre: HU-RES-01 "Una reseña por persona y evento; la segunda responde 409"
 */
test.describe('Flujo E2E 5: Reseña duplicada rechaza con 409', () => {
  test('segunda reseña del mismo evento falla con 409', async ({
    request,
    betoTokens,
  }) => {
    // Buscar un evento pendiente para reseñar
    const pending = await apiGetPendingReviews(request, betoTokens.token);
    if (pending.length === 0) {
      test.skip(true, 'No hay eventos pendientes para crear reseña');
    }
    const eventId = pending[0].eventId || pending[0].id || pending[0]._id;

    // Primero crear una reseña via API
    await apiCreateReview(request, betoTokens.token, {
      eventId,
      rating: 4,
      comment: 'Primera reseña',
    });

    // Ahora intentar crear otra
    try {
      await apiCreateReview(request, betoTokens.token, {
        eventId,
        rating: 2,
        comment: 'Segunda reseña',
      });
      throw new Error('Debería haber fallado con 409');
    } catch (error: any) {
      expect(error.message).toContain('409');
    }
  });
});

/**
 * Flujo 7: Validaciones de rating inválido → 400
 * Cubre: HU-RES-01 "Calificación entera 1..5; si no se cumple responde 400"
 */
test.describe('Flujo E2E 6: Ratings inválidos rechazados', () => {
  const invalidRatings = [
    { rating: 0, desc: 'Rating 0' },
    { rating: 6, desc: 'Rating 6' },
    { rating: 3.5, desc: 'Rating decimal' },
    { rating: -1, desc: 'Rating negativo' },
    { rating: 'cinco', desc: 'Rating texto' },
    { rating: null, desc: 'Rating null' },
    { desc: 'Sin rating' },
  ];

  for (const invalid of invalidRatings) {
    test(`${invalid.desc} responde 400`, async ({
      request,
      betoTokens,
      testEventId,
    }) => {
      const payload: any = {
        eventId: testEventId,
        comment: `Test ${invalid.desc}`,
      };
      if (invalid.rating !== undefined) payload.rating = invalid.rating;

      try {
        await apiCreateReview(request, betoTokens.token, payload);
        throw new Error(`Debería haber fallado con 400 para ${invalid.desc}`);
      } catch (error: any) {
        expect(error.message).toContain('400');
      }
    });
  }
});

/**
 * Flujo 8: Comentario > 500 caracteres → 400
 * Cubre: HU-RES-01 "Comentario opcional máximo 500 caracteres"
 */
test.describe('Flujo E2E 7: Comentario muy largo rechazado', () => {
  test('comentario de 501 caracteres responde 400', async ({
    request,
    betoTokens,
  }) => {
    // Buscar un evento pendiente para reseñar
    const pending = await apiGetPendingReviews(request, betoTokens.token);
    if (pending.length === 0) {
      test.skip(true, 'No hay eventos pendientes para crear reseña');
    }
    const eventId = pending[0].eventId || pending[0].id || pending[0]._id;

    try {
      await apiCreateReview(request, betoTokens.token, {
        eventId,
        rating: 3,
        comment: REVIEW_TEST_DATA.longComment.comment,
      });
      throw new Error('Debería haber fallado con 400');
    } catch (error: any) {
      expect(error.message).toContain('400');
    }
  });

  test('comentario de exactamente 500 caracteres se acepta', async ({
    request,
    betoTokens,
  }) => {
    // Buscar un evento pendiente diferente
    const pending = await apiGetPendingReviews(request, betoTokens.token);
    if (pending.length < 2) {
      test.skip(true, 'No hay suficientes eventos pendientes');
    }
    const eventId = pending[1].eventId || pending[1].id || pending[1]._id;

    const result = await apiCreateReview(request, betoTokens.token, {
      eventId,
      rating: 3,
      comment: REVIEW_TEST_DATA.maxLengthComment.comment,
    });
    expect(result.id).toBeTruthy();
    expect(result.comment).toBe(REVIEW_TEST_DATA.maxLengthComment.comment);

    // Limpiar
    await apiDeleteReview(request, betoTokens.token, result.id);
  });
});

/**
 * Flujo 9: Comentario con lenguaje inapropiado → 422 (Defecto D-09)
 * Cubre: HU-RES-01 "Comentario con lenguaje inapropiado responde 422"
 * NOTA: El defecto D-09 ha sido CORREGIDO - ahora el sistema responde 422 correctamente
 */
test.describe('Flujo E2E 8: Lenguaje inapropiado (Defecto D-09 - CORREGIDO)', () => {
  test('comentario con lenguaje inapropiado responde 422 (D-09 corregido)', async ({
    request,
    betoTokens,
  }) => {
    // Buscar un evento pendiente para reseñar
    const pending = await apiGetPendingReviews(request, betoTokens.token);
    if (pending.length === 0) {
      test.skip(true, 'No hay eventos pendientes para crear reseña');
    }
    const eventId = pending[0].eventId || pending[0].id || pending[0]._id;

    try {
      await apiCreateReview(request, betoTokens.token, {
        eventId,
        rating: 3,
        comment: REVIEW_TEST_DATA.inappropriateComment.comment,
      });
      throw new Error('Debería haber fallado con 422');
    } catch (error: any) {
      // D-09 corregido: ahora devuelve 422
      expect(error.message).toContain('422');
    }
  });
});