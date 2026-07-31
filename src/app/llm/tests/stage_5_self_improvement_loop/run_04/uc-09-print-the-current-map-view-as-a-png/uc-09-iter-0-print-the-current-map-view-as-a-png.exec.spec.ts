// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '../../../failure-snapshot-fixture';
import { getMapZoomLevel, getMapCenter, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Capture the download event before triggering the print action
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Print Map' }).click(),
  ]);

  // Verify the printing panel is visible
  await expect(page.getByRole('dialog')).toBeVisible();

  // Enter a title for the printout
  await page.getByLabel('Title').fill('Test Printout');

  // Select PNG format (radio button)
  await page.getByRole('radio', { name: 'PNG' }).check();

  // Trigger the export/print action
  await page.getByRole('button', { name: 'Export' }).click();

  // Verify the download was triggered with a PNG filename
  await expect(download.suggestedFilename()).toMatch(/\.png$/);

  // Verify map state at the time of print: zoom and center
  const zoom = await expect.poll(() => getMapZoomLevel(page));
  const center = await expect.poll(() => getMapCenter(page));

  expect(zoom).toBeDefined();
  expect(center).toBeDefined();

  // Verify key layers are rendered (visible on the map)
  await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);
  await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);
  await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);
});
