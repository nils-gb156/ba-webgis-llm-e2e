// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '../../../failure-snapshot-fixture';
import { getMapZoomLevel } from '../../../../map-model-helpers';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready
  await expect.poll(() => getMapZoomLevel(page)).toBeDefined();

  // 1. Open the printing panel
  const printToggle = page.getByTestId('print-toggle');
  await printToggle.click();

  // 2. The printing panel is visible
  await expect(page.getByTestId('info-panel')).toBeVisible();

  // 3. Enter a title for the printout
  // Assuming the info panel contains the print form with a title input
  // We'll use getByRole with label or placeholder to find the title field
  await page.getByLabel('Title').fill('Map Printout');

  // 4. Select the PNG file format
  // Assuming there is a radio group or select for format
  await page.getByRole('radio', { name: 'PNG' }).click();

  // 5. Trigger the export/print
  // Assuming there is a print/export button in the info panel
  await page.getByRole('button', { name: 'Print' }).click();

  // 6. A PNG file is generated and downloaded
  // We need to capture the download event
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Print' }).click(), // Re-click if the first click didn't trigger download immediately or if we need to ensure it
  ]);

  // Assert the download happened and has the correct suggested filename
  expect(download.suggestedFilename()).toMatch(/\.png$/);
});
