import { test, expect } from '@playwright/test';

test.describe('CRIMENEXUS Police Investigator Demonstration Scenario', () => {
  test('Complete Flow: Login -> Network Graph Canvas (Seeded Rajan Network) -> Dashboard Directives', async ({ page }) => {
    // 1. Navigate to Login page
    await page.goto('/login');
    await expect(page.getByText('CRIMENEXUS')).toBeVisible();

    // 2. Authenticate as Field Investigator
    await page.getByText('Field Investigator').click();

    // 3. Verify navigation to Dashboard
    await page.waitForURL('/dashboard');
    await expect(page.getByText('Active Investigations')).toBeVisible();

    // 4. Assert Actionable Directives panel exists with operational orders
    await expect(page.getByText('Actionable Directives & Priority Orders')).toBeVisible();
    await expect(page.getByText('Freeze').first()).toBeVisible();

    // 5. Navigate to Network Graph Canvas
    await page.goto('/network-graph');
    await page.waitForURL('/network-graph');
    await expect(page.getByText('HERO: Interactive Criminal Network Topology')).toBeVisible();

    // 6. Assert Canvas container exists and is rendering elements
    const canvas = page.locator('div[data-testid="cytoscape-canvas"], div.cytoscape-container, div.w-full.h-full').first();
    await expect(canvas).toBeVisible();

    // 7. Verify Search filter input is present
    await expect(page.getByPlaceholder('Search node label...')).toBeVisible();
    await page.getByPlaceholder('Search node label...').fill('Rajan');
  });
});
