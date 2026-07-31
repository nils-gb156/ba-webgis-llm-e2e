// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapZoomLevel, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Precondition: at least one base map and one overlay layer are visible.
  await expect.poll(() => getMapZoomLevel(page)).toBeGreaterThanOrEqual(0);
  await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

  // Step 1: Open the printing panel.
  await page.getByRole('button', { name: 'Print Map' }).click();

  // Expected: The printing panel is visible.
  await expect(page.getByRole('dialog')).toBeVisible();

  // Step 2: Enter a title for the printout.
  await page.getByRole('textbox', { name: 'Title' }).fill('My Map Print');

  // Step 3: Select the PNG file format.
  await page.getByRole('combobox', { name: 'Format' }).selectOption('png');

  // Step 4: Trigger the export.
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: /export|print/i }).click(),
  ]);

  // Expected: A PNG file is generated and downloaded.
  expect(download.suggestedFilename()).toMatch(/\.png$/);
});
