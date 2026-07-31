// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('UC9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the application to load and map to be ready
  await page.getByTestId('map-container').waitFor({ state: 'visible' });
  
  // Wait for at least one base layer and one overlay layer to be visible
  // We poll the map state helpers to ensure layers are actually rendered
  const mapHelpers = await import('../../../src/map/mapModelHelpers');
  
  await expect.poll(() => mapHelpers.getActiveBaseLayerName(page)).toBeTruthy();
  await expect.poll(() => mapHelpers.getActiveOverlayLayerNames(page)).resolves.toHaveLength(1);

  // Step 1: Click the 'Print Map' button in the toolbar to open the printing panel
  const printButton = page.getByRole('button', { name: 'Print Map' });
  await printButton.click();

  // Verify the printing panel is visible
  const printPanel = page.getByRole('dialog', { name: /Print/ });
  await expect(printPanel).toBeVisible();

  // Step 2: Enter a title for the printout
  const titleInput = page.getByLabel('Title');
  await titleInput.fill('Test Printout');

  // Step 3: Select the PNG file format
  // Assuming the format selector is a radio group or dropdown. 
  // If it's a radio group, we select the PNG option.
  const pngOption = page.getByRole('radio', { name: 'PNG' });
  await pngOption.click();

  // Step 4: Click the export/print button
  const exportButton = page.getByRole('button', { name: /Export|Print|OK/ });
  
  // Wait for the download event before clicking the button
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    exportButton.click()
  ]);

  // Verify the file was downloaded and has a PNG extension
  const suggestedFilename = download.suggestedFilename();
  expect(suggestedFilename).toMatch(/\.png$/);

  // Clean up the downloaded file
  await download.delete();
});
