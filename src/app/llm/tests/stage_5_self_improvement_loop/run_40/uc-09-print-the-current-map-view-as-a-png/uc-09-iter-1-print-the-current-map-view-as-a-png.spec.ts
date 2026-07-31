// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';
import { getMapZoomLevel, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Precondition: verify at least one base map and one overlay layer are visible
  await expect.poll(() => getMapZoomLevel(page)).toBeGreaterThan(0);
  await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

  // 1. Open the printing panel
  await page.getByRole('button', { name: 'Print Map' }).click();

  // 2. Enter a title for the printout
  await page
    .getByRole('dialog', { name: 'Print Map' })
    .getByLabel('Title')
    .fill('Map Export');

  // 3. Select the PNG file format
  // The file format is a combobox, not a radio group. Select the PNG option.
  await page
    .getByRole('dialog', { name: 'Print Map' })
    .getByLabel('File format')
    .selectOption('PNG');

  // 4. Click the export/print button
  const downloadPromise = page.waitForEvent('download');
  await page
    .getByRole('dialog', { name: 'Print Map' })
    .getByRole('button', { name: 'Export map' })
    .click();

  // Assert that a PNG file was downloaded
  const download = await downloadPromise;
  const suggested = download.suggestedFilename().toLowerCase();
  expect(suggested).toMatch(/\.png$/);
});
