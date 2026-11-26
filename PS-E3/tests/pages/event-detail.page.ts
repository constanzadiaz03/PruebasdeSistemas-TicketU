import { Page, Locator, expect } from '@playwright/test';

export class EventDetailPage {
  readonly page: Page;
  readonly title: Locator;
  readonly description: Locator;
  readonly dateTime: Locator;
  readonly location: Locator;
  readonly price: Locator;
  readonly organizer: Locator;
  readonly statusBadge: Locator;
  readonly buyButton: Locator;
  readonly reserveButton: Locator;
  readonly cancelledNotice: Locator;
  readonly reviewsSection: Locator;

  constructor(page: Page) {
    this.page = page;
    this.title = page.locator('[data-testid="event-title"], h1, h2').first();
    this.description = page.locator('[data-testid="event-description"], .event-description').first();
    this.dateTime = page.locator('[data-testid="event-datetime"], .event-date, time').first();
    this.location = page.locator('[data-testid="event-location"], .event-location').first();
    this.price = page.locator('[data-testid="event-price"], .event-price, .price').first();
    this.organizer = page.locator('[data-testid="event-organizer"], .event-organizer').first();
    this.statusBadge = page.locator('[data-testid="event-status"], .event-status, .badge').first();
    this.buyButton = page.locator('[data-testid="buy-button"], button:has-text("Comprar"), button:has-text("Reservar")').first();
    this.reserveButton = page.locator('[data-testid="reserve-button"], button:has-text("Reservar")').first();
    this.cancelledNotice = page.locator('text=Este evento fue cancelado, text=Evento cancelado, .cancelled-notice').first();
    this.reviewsSection = page.locator('[data-testid="reviews-section"], .reviews-section, section:has(h2:has-text("Reseñas"))').first();
  }

  async goto(eventId: string): Promise<void> {
    await this.page.goto(`https://pruebasdesistemauv.com/ticketu/#/event/${eventId}`);
    await this.page.waitForLoadState('networkidle');
  }

  async expectEventLoaded(): Promise<void> {
    await expect(this.title).toBeVisible();
  }

  async expectCancelled(): Promise<void> {
    await expect(this.cancelledNotice).toBeVisible();
    await expect(this.buyButton).not.toBeVisible();
    await expect(this.reserveButton).not.toBeVisible();
  }

  async expectPublished(): Promise<void> {
    await expect(this.cancelledNotice).not.toBeVisible();
    await expect(this.buyButton.or(this.reserveButton)).toBeVisible();
  }

  async getEventIdFromUrl(): Promise<string> {
    const url = this.page.url();
    const match = url.match(/\/event\/([^/?#]+)/);
    return match?.[1] || '';
  }
}