import { test, expect } from '@playwright/test';
import * as fs from 'fs';

test.describe('CRIMENEXUS End-to-End Police Investigator Workflow', () => {
  test('Complete IO Operational Flow: Login -> Cytoscape Graph -> Smurfing Tripwire -> Court Dossier Download -> Design System', async ({ page }) => {
    // 1. Navigate to /login and log in as an inspector
    await page.goto('/login');
    await expect(page.locator('h1:has-text("CRIMENEXUS")')).toBeVisible();

    const inspectorButton = page.getByText('Field Investigator').first();
    await expect(inspectorButton).toBeVisible();
    await inspectorButton.click();

    // Verify successful authentication and redirection to dashboard
    await page.waitForURL('**/dashboard');
    await expect(page.getByText('Operational Command Center & Case Synthesis')).toBeVisible();

    // 2. Navigate to /graph (redirects to /network-graph) and verify Cytoscape topology
    await page.goto('/graph');
    await page.waitForURL('**/network-graph');

    // Wait for the Cytoscape canvas and assert the node/legend for "Rajan" is visible
    const cytoscapeCanvas = page.locator('canvas').first();
    await expect(cytoscapeCanvas).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Kingpin (Rajan)').first()).toBeVisible();

    // 3. Navigate to /dashboard and assert the smurfing alert banner is visible
    await page.goto('/dashboard');
    await page.waitForURL('**/dashboard');

    const tripwireBanner = page.locator('#tour-alerts');
    await expect(tripwireBanner).toBeVisible();
    await expect(tripwireBanner.getByText('CRITICAL FINANCIAL TRIPWIRE')).toBeVisible();
    await expect(tripwireBanner.getByText('Action Required: Freeze Account')).toBeVisible();
    await expect(tripwireBanner.getByText('due to Smurfing')).toBeVisible();

    // 4. Click "Download Court Dossier", intercept the download and assert PDF file size > 10KB
    const downloadPromise = page.waitForEvent('download');
    const dossierBtn = page.locator('#tour-dossier-btn');
    await expect(dossierBtn).toBeVisible();
    await dossierBtn.click();

    const download = await downloadPromise;
    const downloadPath = await download.path();
    expect(downloadPath).toBeTruthy();

    const stats = fs.statSync(downloadPath!);
    console.log(`[E2E] Downloaded Dossier PDF: ${download.suggestedFilename()}, size: ${stats.size} bytes (${(stats.size / 1024).toFixed(2)} KB)`);
    expect(stats.size).toBeGreaterThan(10 * 1024); // Assert > 10KB

    // 5. Navigate to /design-system and assert the page loads successfully
    await page.goto('/design-system');
    await page.waitForURL('**/design-system');
    await expect(page.getByText('CRIMENEXUS Design System')).toBeVisible();
    await expect(page.getByText('1. Core Color Token Architecture')).toBeVisible();
    await expect(page.getByText('FIGMA TOKENS v1.0')).toBeVisible();
  });
});
