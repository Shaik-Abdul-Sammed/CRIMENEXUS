import { test, expect } from '@playwright/test';

test.describe('CRIMENEXUS Production E2E Investigation Workflows', () => {
  test('Flow 1: Persona Login -> Dashboard Access', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByText('CRIMENEXUS')).toBeVisible();

    // Click Field Investigator Persona
    await page.getByText('Field Investigator').click();

    // Verify navigation to Dashboard
    await page.waitForURL('/dashboard');
    await expect(page.getByText('Active Investigations')).toBeVisible();
  });

  test('Flow 2: Dashboard -> Case Workspace -> Cytoscape Network Graph', async ({ page }) => {
    await page.goto('/dashboard');
    await page.getByText('Investigations').first().click();

    await page.waitForURL('/cases');
    await page.getByText('Operation Shadow Vault').first().click();

    // Launch Network Canvas
    await page.getByText('Launch Network Graph').first().click();
    await page.waitForURL('/network-graph');
    await expect(page.getByText('HERO: Criminal Network Topology')).toBeVisible();
  });

  test('Flow 3: Entity Directory -> Grounded Evidence Inspection', async ({ page }) => {
    await page.goto('/entities');
    await expect(page.getByText('Extracted Entity Directory')).toBeVisible();

    await page.getByText('Ramesh Kumar').first().click();
    await expect(page.getByText('Structured Attributes Ledger')).toBeVisible();
  });

  test('Flow 4: AI Assistant -> Grounded Evidence Discovery', async ({ page }) => {
    await page.goto('/ai-assistant');
    await expect(page.getByText('AI Investigation Assistant')).toBeVisible();
    await expect(page.getByText('INVESTIGATIVE ASSISTANCE GUARANTEE')).toBeVisible();

    // Click preset query
    await page.getByText('"Explain the connections found in this case"').click();
    await expect(page.getByText('AI Network Synthesis')).toBeVisible();
  });

  test('Flow 5: Admin Session -> Audit Logs Inspection', async ({ page }) => {
    await page.goto('/login');
    await page.getByText('System Administrator').click();

    await page.goto('/audit-logs');
    await expect(page.getByText('Immutable System Security Audit Logs')).toBeVisible();
  });
});
