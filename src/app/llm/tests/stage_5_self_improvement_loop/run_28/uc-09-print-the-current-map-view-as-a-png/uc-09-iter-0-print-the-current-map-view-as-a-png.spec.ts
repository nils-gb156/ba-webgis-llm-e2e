// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready and at least one operational layer to be rendered
  await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

  // Capture the download event before triggering the action
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Print Map' }).click(),
  ]);

  // Verify the print panel is visible
  await expect(page.getByRole('dialog')).toBeVisible();

  // Enter a title for the printout
  await page.getByLabel('Title').fill('My Map Printout');

  // Select the PNG file format
  await page.getByRole('radio', { name: 'PNG' }).check();

  // Click the export/print button
  await page.getByRole('button', { name: 'Export' }).click();

  // Verify the file was downloaded
  await expect(download.suggestedFilename()).toMatch(/.*\.png$/);
});
