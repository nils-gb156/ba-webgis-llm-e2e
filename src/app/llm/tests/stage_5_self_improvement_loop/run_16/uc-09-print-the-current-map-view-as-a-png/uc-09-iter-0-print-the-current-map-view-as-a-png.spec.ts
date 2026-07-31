// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapZoomLevel, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  // Navigate to the application
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready and layers to be rendered
  await expect.poll(() => getMapZoomLevel(page)).toBeDefined();
  await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

  // Step 4: The user clicks the export/print button.
  // We start listening for the download before clicking the button.
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Print Map' }).click(),
  ]);

  // Verify the printing panel is visible
  const printPanel = page.getByRole('dialog', { name: /Print Map/i });
  await expect(printPanel).toBeVisible();

  // Step 2: The user enters a title for the printout.
  await page.getByRole('textbox', { name: 'Title' }).fill('E2E Test Printout');

  // Step 3: The user selects the PNG file format.
  // The format is a radio group. We select the PNG radio button.
  await page.getByRole('radio', { name: 'PNG' }).click();

  // Step 4 (continued): The user clicks the export/print button.
  // We wait for the download event to be triggered by the export button.
  const [download2] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Export' }).click(),
  ]);

  // Verify that a PNG file was downloaded
  expect(download2.suggestedFilename()).toMatch(/\.png$/);
});
