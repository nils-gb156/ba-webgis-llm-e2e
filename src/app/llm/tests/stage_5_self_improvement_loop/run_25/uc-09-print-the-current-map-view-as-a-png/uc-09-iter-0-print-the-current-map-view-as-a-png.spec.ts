// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapZoomLevel } from '../../../../map-model-helpers';

test('UC9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready (zoom level is defined)
  await expect.poll(() => getMapZoomLevel(page)).toBeDefined();

  // Step 1: Open the printing panel
  const printToggle = page.getByRole('button', { name: 'Print Map' });
  await printToggle.click();

  // Verify the printing panel is visible
  await expect(page.getByTestId('print-toggle')).toBeVisible();

  // Step 2: Enter a title for the printout
  await page.getByLabel('Title').fill('My Map Printout');

  // Step 3: Select the PNG file format
  await page.getByRole('radio', { name: 'PNG' }).check();

  // Step 4: Trigger the export
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Export' }).click(),
  ]);

  // Verify the download
  expect(download.suggestedFilename()).toBe('map.png');
});
