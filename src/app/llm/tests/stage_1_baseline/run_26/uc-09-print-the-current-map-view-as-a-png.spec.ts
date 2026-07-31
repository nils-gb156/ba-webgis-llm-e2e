// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  // Precondition: The app is loaded successfully.
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready and layers to be visible.
  // We use a generic map container locator since specific test IDs for map readiness
  // are not provided in the prompt, but we assume the map canvas exists.
  await expect(page.locator('canvas.ol-layer')).toBeVisible({ timeout: 30000 });

  // Precondition: The printing tool is accessible via the toolbar.
  // We look for the print button by its accessible name or a likely test ID.
  // Assuming the print button has a test id or accessible name "Print Map".
  const printButton = page.getByRole('button', { name: 'Print Map' });
  await expect(printButton).toBeVisible();

  // Step 1: The user clicks the 'Print Map' button in the toolbar to open the printing panel.
  await printButton.click();

  // Expected result: The printing panel is visible.
  // Assuming the printing panel has a test id or is a dialog/panel with a specific role.
  // We'll look for a panel or dialog that contains common print form elements.
  const printPanel = page.getByRole('dialog', { name: /Print/ }).or(page.getByTestId('print-panel'));
  await expect(printPanel).toBeVisible({ timeout: 10000 });

  // Step 2: The user enters a title for the printout.
  // Assuming there is a text input for the title.
  const titleInput = page.getByLabel('Title').or(page.getByTestId('print-title'));
  await expect(titleInput).toBeVisible();
  await titleInput.fill('My Map Printout');

  // Step 3: The user selects the PNG file format.
  // Assuming there is a radio group or select for format.
  const pngFormatOption = page.getByRole('radio', { name: 'PNG' }).or(page.getByTestId('format-png'));
  await expect(pngFormatOption).toBeVisible();
  await pngFormatOption.click({ force: true });

  // Step 4: The user clicks the export/print button.
  const exportButton = page.getByRole('button', { name: /Export|Print|Generate/ }).or(page.getByTestId('print-export'));
  await expect(exportButton).toBeVisible();

  // Set up download listener before clicking.
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    exportButton.click()
  ]);

  // Expected result: A PNG file containing the current map view is generated and downloaded.
  const suggestedFilename = download.suggestedFilename();
  expect(suggestedFilename).toMatch(/\.png$/i);

  // Clean up the downloaded file to avoid cluttering the test environment.
  await download.delete();

  // Note: Verifying the content of the downloaded image (base map, overlay, scale bar)
  // is complex and typically requires image processing libraries which are not standard
  // in Playwright tests. The successful download of a PNG file is the primary assertion.
});
