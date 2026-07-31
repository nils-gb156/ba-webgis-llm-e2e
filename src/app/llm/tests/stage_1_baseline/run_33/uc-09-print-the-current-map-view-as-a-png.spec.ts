// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  // Navigate to the application base URL
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the application to load and map to be ready
  // Assuming a test id for the map container or main app root
  await page.waitForSelector('[data-testid="map-container"]', { state: 'visible' });

  // Wait for at least one base map and one overlay layer to be visible
  // This is a heuristic check; we assume the map loads tiles eventually.
  // We wait for the map canvas to be present and potentially some layer indicators if available.
  // Since we cannot assert map content directly via DOM, we rely on the canvas existing
  // and the UI being interactive.
  const mapCanvas = page.locator('canvas');
  await expect(mapCanvas).toBeVisible();

  // Step 1: Click the 'Print Map' button in the toolbar to open the printing panel.
  // Locate the print button. It might have a specific test id or role.
  const printButton = page.getByRole('button', { name: 'Print Map' }).first();
  await expect(printButton).toBeVisible();
  await printButton.click();

  // Step 2: The printing panel is visible.
  // Locate the printing panel/dialog.
  const printPanel = page.getByRole('dialog', { name: /Print/ }).first();
  // Or if it's a side panel, check for visibility of a specific container
  // Assuming it's a dialog/modal based on typical "panel" behavior in such contexts,
  // or a specific div. Let's try to find the form elements inside the panel.
  // If getByRole('dialog') doesn't work, we might need to look for a specific test id.
  // Let's assume there's a test id for the print panel or we can infer it from the form.
  
  // Wait for the print form to appear.
  // We look for a title input inside the print panel context.
  // If the panel doesn't have a specific role name, we might need to scope by a known element.
  // Let's try to find the title input directly.
  const titleInput = page.getByLabel('Title').first();
  await expect(titleInput).toBeVisible({ timeout: 10000 });

  // Step 3: Enter a title for the printout.
  await titleInput.fill('Test Map Print');

  // Step 4: Select the PNG file format.
  // Locate the format selector. It might be a radio group or a select dropdown.
  // Let's try to find a radio button or option for PNG.
  const pngFormatOption = page.getByRole('radio', { name: 'PNG' }).first();
  const svgFormatOption = page.getByRole('radio', { name: 'SVG' }).first();
  
  // Check if PNG is already selected
  const isPngSelected = await pngFormatOption.isChecked();
  if (!isPngSelected) {
    // Click the PNG radio button
    // Use force: true if Chakra UI wraps the input
    await pngFormatOption.click({ force: true });
  }

  // Verify PNG is selected
  await expect(pngFormatOption).toBeChecked();

  // Step 5: Click the export/print button.
  const exportButton = page.getByRole('button', { name: /Export|Print|Generate/ }).first();
  await expect(exportButton).toBeVisible();
  
  // Wait for the download to start before clicking
  const downloadPromise = page.waitForEvent('download');
  await exportButton.click();

  // Step 6: Verify the PNG file is generated and downloaded.
  const download = await downloadPromise;
  const suggestedFilename = download.suggestedFilename();
  
  // Check that the file has a .png extension
  expect(suggestedFilename.toLowerCase()).toMatch(/\.png$/);

  // Clean up the downloaded file
  await download.delete();
});
