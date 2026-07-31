// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getMapZoomLevel, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Precondition: verify the map is loaded and some layers are visible
  await expect.poll(() => getMapZoomLevel(page)).toBeDefined();
  await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);
  await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);

  // Step 1: Open the printing panel
  await page.getByRole('button', { name: 'Print Map' }).click();

  // Step 2: Enter a title for the printout
  await page.getByRole('textbox', { name: 'Title' }).fill('My Map Printout');

  // Step 3: Select PNG format
  await page.getByRole('radio', { name: 'PNG' }).click();

  // Step 4: Trigger the export
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Export' }).click(),
  ]);

  // Expected result: a PNG file is generated and downloaded
  expect(download.suggestedFilename()).toMatch(/\.png$/);
});
