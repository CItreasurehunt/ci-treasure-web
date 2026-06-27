import { test, expect } from '@playwright/test';

test.describe('Public Smoke Tests', () => {
  test('homepage renders event cards', async ({ page }) => {
    await page.goto('/');

    // Check for hero text
    await expect(page.getByRole('heading', { name: /Contact Improvisation events/i })).toBeVisible();

    // Check that at least one event card is visible
    const eventCards = page.locator('div[id^="event-card-"]');
    await expect(eventCards.first()).toBeVisible();

    const count = await eventCards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('country filter updates the list', async ({ page }) => {
    await page.goto('/');

    // Get initial count
    const initialEventCards = page.locator('div[id^="event-card-"]');
    await expect(initialEventCards.first()).toBeVisible();
    const initialCount = await initialEventCards.count();

    // Select a country
    const countrySelect = page.locator('select').first();
    const options = await countrySelect.locator('option').allInnerTexts();

    if (options.length > 1) {
      // Pick the second option if "All Countries" is the first
      const secondOptionValue = await countrySelect.locator('option').nth(1).getAttribute('value');
      if (secondOptionValue) {
        await countrySelect.selectOption(secondOptionValue);

        // Wait for filtering (next.js router replace might take a moment)
        await page.waitForTimeout(1000);

        const filteredCount = await page.locator('div[id^="event-card-"]').count();
        expect(filteredCount).toBeLessThanOrEqual(initialCount);
      }
    }
  });

  test('event detail page renders', async ({ page }) => {
    // Using known hardcoded short_id from production
    await page.goto('/events/JedO-london-contact-festival');

    await expect(page.getByRole('heading', { name: 'London Contact Festival' })).toBeVisible();
    await expect(page.getByText('Dates')).toBeVisible();
    await expect(page.getByText('Location')).toBeVisible();
  });

  test('venue detail page renders', async ({ page }) => {
    // Using known hardcoded slug from production
    await page.goto('/venues/goldsmiths-university-of-london');

    await expect(page.getByRole('heading', { name: 'Goldsmiths, University of London' })).toBeVisible();
    await expect(page.getByText('About the venue')).toBeVisible();
  });

  test('teacher detail page renders', async ({ page }) => {
    // Using known hardcoded slug from production
    await page.goto('/teachers/mary-prestidge');

    await expect(page.getByRole('heading', { name: 'Mary Prestidge' })).toBeVisible();
    await expect(page.getByText('About', { exact: true })).toBeVisible();
  });

  test('communities page renders', async ({ page }) => {
    await page.goto('/communities');

    await expect(page.getByRole('heading', { name: /CI Communities Worldwide/i })).toBeVisible();

    // Check that community count text is visible
    // Using first() to avoid strict mode violation if multiple elements match
    await expect(page.getByText(/communities/).first()).toBeVisible();
    await expect(page.getByText(/countries/).first()).toBeVisible();

    // Verify at least one community card exists
    // We look for community names which are h3 tags
    const communityCards = page.locator('h3');
    await expect(communityCards.first()).toBeVisible();
    const count = await communityCards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('mobile viewport renders correctly', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Mobile only test');

    await page.goto('/');

    // Verify no horizontal scroll
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });

    expect(hasHorizontalScroll).toBe(false);

    // Check if mobile view buttons are visible
    await expect(page.getByRole('button', { name: 'List' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Map' })).toBeVisible();
  });
});
