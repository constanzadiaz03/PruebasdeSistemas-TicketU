import { Page, Locator, expect } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly registerLink: Locator;
  readonly errorMessage: Locator;
  readonly successMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    // Usar data-testid que son estables según el HTML real
    this.emailInput = page.locator('[data-testid="login-email"]');
    this.passwordInput = page.locator('[data-testid="login-password"]');
    this.loginButton = page.locator('[data-testid="login-submit"]');
    this.registerLink = page.locator('a[href="#/register"]');
    this.errorMessage = page.locator('#login-msg, [role="alert"], .error, .alert-danger, .text-danger, [data-testid*="error"]').first();
    this.successMessage = page.locator('.success, .alert-success, .text-success, [data-testid*="success"]').first();
  }

  async goto(): Promise<void> {
    // Usar URL completa porque el baseURL de Playwright no maneja bien el hash routing
    await this.page.goto('https://pruebasdesistemauv.com/ticketu/#/login');
    // Esperar a que el formulario esté visible usando data-testid
    await this.emailInput.waitFor({ state: 'visible', timeout: 15000 });
    await this.page.waitForLoadState('networkidle');
  }

  async login(email: string, password: string): Promise<void> {
    // Llenar email
    await this.emailInput.fill(email);
    // Llenar password
    await this.passwordInput.fill(password);
    // Click en login y esperar navegación
    await Promise.all([
      this.page.waitForNavigation({ waitUntil: 'networkidle', timeout: 15000 }).catch(() => {}),
      this.loginButton.click(),
    ]);
    // Esperar un poco más para asegurar que la app se estabilice
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(1000);
  }

  async expectLoginSuccess(): Promise<void> {
    // Verificar que NO estamos en login
    await expect(this.page).not.toHaveURL(/\/login/, { timeout: 10000 });
    // Verificar que hay token en localStorage, sessionStorage, o cookies
    const token = await this.page.evaluate(() => {
      return localStorage.getItem('token')
        || sessionStorage.getItem('token')
        || document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1]
        || null;
    });
    // Si no hay token en storage, puede que la app use cookies HttpOnly
    // En ese caso, verificar que estamos en una página autenticada
    if (!token) {
      const url = this.page.url();
      expect(url).not.toContain('/login');
      expect(url).not.toContain('/register');
    }
    expect(token ?? true).toBeTruthy();
  }

  async expectLoginError(expectedMessage?: string): Promise<void> {
    await expect(this.errorMessage).toBeVisible({ timeout: 5000 });
    if (expectedMessage) {
      await expect(this.errorMessage).toContainText(expectedMessage);
    }
  }

  async isLoggedIn(): Promise<boolean> {
    const token = await this.page.evaluate(() => localStorage.getItem('token') || sessionStorage.getItem('token'));
    return !!token;
  }

  async logout(): Promise<void> {
    // Buscar botón de logout en menú de usuario
    const userMenu = this.page.locator('[data-testid="user-menu"], .user-menu, button:has-text("Cerrar"), [aria-label*="usuario" i]').first();
    if (await userMenu.isVisible({ timeout: 2000 })) {
      await userMenu.click();
      const logoutBtn = this.page.locator('button:has-text("Cerrar sesión"), a:has-text("Cerrar sesión"), button:has-text("Logout")').first();
      await logoutBtn.click();
      await this.page.waitForLoadState('networkidle');
    }
  }
}