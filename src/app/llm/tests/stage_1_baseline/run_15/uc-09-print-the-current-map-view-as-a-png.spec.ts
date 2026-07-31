// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready and layers to be visible
  // Assuming standard test IDs for the map container and initial load
  await page.waitForSelector('[data-testid="map-container"]', { state: 'visible' });
  
  // Wait for at least one base map and one overlay layer to be visible.
  // We check for the existence of layer indicators or simply wait for map interactions to be possible.
  // Since we can't assert DOM elements for map layers directly, we wait for a short period
  // or rely on the map being interactive. Let's wait for the map canvas to be visible.
  await page.locator('canvas').first().waitFor({ state: 'visible' });

  // Step 1: The user clicks the 'Print Map' button in the toolbar to open the printing panel.
  const printButton = page.getByRole('button', { name: 'Print Map' });
  await printButton.click();

  // Verify the printing panel is visible
  const printPanel = page.getByRole('dialog', { name: /Print/ }).or(page.getByTestId('print-panel'));
  // Fallback if no specific dialog role/testid is known, look for common print form elements
  if (!printPanel) {
     // Try to find the panel by its content if role/testid is ambiguous
     await page.waitForSelector('[data-testid="print-title-input"]', { state: 'visible' });
  } else {
     await expect(printPanel).toBeVisible();
  }

  // Step 2: The user enters a title for the printout.
  const titleInput = page.getByLabel('Title').or(page.getByTestId('print-title-input'));
  await titleInput.fill('Test Map Print');

  // Step 3: The user selects the PNG file format.
  const formatSelect = page.getByLabel('Format').or(page.getByTestId('print-format-select'));
  await formatSelect.selectOption('PNG');

  // Step 4: The user clicks the export/print button.
  // Prepare for download
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: /Print|Export|Generate/ }).first().click()
  ]);

  // Verify the file was generated and downloaded
  const suggestedFilename = download.suggestedFilename();
  expect(suggestedFilename).toMatch(/\.png$/);
  
  // Clean up the downloaded file
  await download.delete();
});
