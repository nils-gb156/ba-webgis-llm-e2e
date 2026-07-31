// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '../../../failure-snapshot-fixture';
import { getMapZoomLevel } from '../../../../map-model-helpers';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Ensure the map is ready and has a zoom level before proceeding
  await expect.poll(() => getMapZoomLevel(page)).toBeDefined();

  // Step 1: The user clicks the 'Print Map' button in the toolbar to open the printing panel.
  const printButton = page.getByRole('button', { name: 'Print Map' });
  await printButton.click();

  // The printing panel is visible.
  await expect(page.getByRole('dialog')).toBeVisible();

  // Step 2: The user enters a title for the printout.
  // We look for a textbox within the print dialog to enter the title.
  await page.getByRole('dialog').getByRole('textbox', { name: 'Title' }).fill('Map Printout');

  // Step 3: The user selects the PNG file format.
  // We look for a radio group or list with 'PNG' as an option.
  const pngOption = page.getByRole('dialog').getByRole('radio', { name: 'PNG' });
  await expect(pngOption).toBeVisible();
  await pngOption.check();

  // Step 4: The user clicks the export/print button.
  // We capture the download event before clicking the export button.
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('dialog').getByRole('button', { name: /export|print/i }).click(),
  ]);

  // A PNG file containing the current map view is generated and downloaded.
  const suggestedFilename = download.suggestedFilename();
  expect(suggestedFilename).toMatch(/\.png$/);
});
