import { test } from '@playwright/test';
import { LoginPage } from './pages/login.page';
import { TEST_USERS } from './utils/api-client';

async function checkState(page: any, userName: string) {
  const pendingCount = await page.locator('[data-testid="review-form"]').count();
  const myReviewsCount = await page.locator('[data-testid="my-review"]').count();

  // Check for any messages in "Por reseñar"
  const noPendingMsg = await page.locator('[data-testid="no-pending-reviews"]').count();

  // Check for any messages in "Mis reseñas" - try multiple possible messages
  const noReviewsMsg1 = await page.locator('text=No has publicado reseñas').count();
  const noReviewsMsg2 = await page.locator('text=Sin reseñas publicadas').count();
  const noReviewsMsg3 = await page.locator('text=No tienes reseñas').count();
  const noReviewsMsg4 = await page.locator('text=No hay reseñas').count();

  // Check review-already
  const reviewAlreadyMsg = await page.locator('[data-testid="review-already"]').count();
  const loginRequiredMsg = await page.locator('[data-testid="login-required"]').count();

  // Get full text of "Mis reseñas" section
  const myReviewsSection = await page.locator('h2:has-text("Mis reseñas")').locator('..').textContent();

  console.log(`${userName}:`);
  console.log(`  Pending events (review forms): ${pendingCount}`);
  console.log(`  My reviews: ${myReviewsCount}`);
  console.log(`  no-pending-reviews: ${noPendingMsg}`);
  console.log(`  No has publicado reseñas: ${noReviewsMsg1}`);
  console.log(`  Sin reseñas publicadas: ${noReviewsMsg2}`);
  console.log(`  No tienes reseñas: ${noReviewsMsg3}`);
  console.log(`  No hay reseñas: ${noReviewsMsg4}`);
  console.log(`  review-already: ${reviewAlreadyMsg}`);
  console.log(`  login-required: ${loginRequiredMsg}`);
  console.log(`  MyReviews section text: ${myReviewsSection?.substring(0, 200)}`);
}

test('check current state - beto', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(TEST_USERS.beto.email, TEST_USERS.beto.password);
  await loginPage.expectLoginSuccess();

  await page.goto('https://pruebasdesistemauv.com/ticketu/#/reviews');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  await checkState(page, 'BETO');
});

test('check current state - ana', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(TEST_USERS.ana.email, TEST_USERS.ana.password);
  await loginPage.expectLoginSuccess();

  await page.goto('https://pruebasdesistemauv.com/ticketu/#/reviews');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  await checkState(page, 'ANA');
});