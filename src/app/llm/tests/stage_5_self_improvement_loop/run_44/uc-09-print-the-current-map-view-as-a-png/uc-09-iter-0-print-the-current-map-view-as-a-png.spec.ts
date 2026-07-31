// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';
import { getMapZoomLevel, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Verify preconditions: map is loaded with base layer and overlay layers visible
  await expect.poll(() => getMapZoomLevel(page)).toBeDefined();
  await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);
  await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);

  // Step 1: Open the printing panel
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Print Map' }).click();

  // Verify the printing panel is visible
  await expect(page.getByRole('dialog', { name: /Print Map/i })).toBeVisible();

  // Step 2: Enter a title for the printout
  await page.getByRole('textbox', { name: /Title/i }).fill('Test Printout');

  // Step 3: Select the PNG file format
  await page.getByRole('radio', { name: 'PNG' }).check();

  // Step 4: Click the export/print button
  await page.getByRole('button', { name: /Print/i }).click();

  // Verify a PNG file is downloaded
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/\.png$/);
});
