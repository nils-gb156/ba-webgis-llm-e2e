// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';
import { getMapCenter, getMapZoomLevel, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Precondition: At least one base map and one overlay layer are visible
  await expect.poll(() => getActiveBaseLayerTitle(page)).toBeTruthy();
  await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);

  // Step 1: Open the printing panel
  await page.getByRole('button', { name: 'Print Map' }).click();

  // Expected result: The printing panel is visible
  await expect(page.getByRole('dialog', { name: /Print/ })).toBeVisible();

  // Step 2: Enter a title for the printout
  await page.getByRole('textbox', { name: /Title/ }).fill('Test Printout');

  // Step 3: Select the PNG file format
  await page.getByRole('radio', { name: 'PNG' }).check();

  // Step 4: Trigger the export/print action
  // Register download listener before the action
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: /Export|Print|Create|Generate/i }).click(),
  ]);

  // Expected result: A PNG file is generated and downloaded
  expect(download.suggestedFilename()).toMatch(/\.png$/);
});
