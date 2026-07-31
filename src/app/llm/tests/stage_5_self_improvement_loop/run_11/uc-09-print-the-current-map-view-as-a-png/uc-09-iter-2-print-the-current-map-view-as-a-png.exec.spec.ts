// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '../../../failure-snapshot-fixture';
import { getMapZoomLevel } from '../../../../map-model-helpers';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready and zoomed to a reasonable level
  await expect.poll(() => getMapZoomLevel(page)).toBeGreaterThan(0);

  // Step 1: Open the printing panel
  await page.getByTestId('print-toggle').click();

  // Verify the printing panel is visible
  await expect(page.getByRole('dialog', { name: 'Print Map' })).toBeVisible();

  // Step 2: Enter a title for the printout
  await page.getByLabel('Title').fill('Test Printout');

  // Step 3: Select the PNG file format
  // The format selector is a select element.
  await page.getByRole('combobox', { name: 'Format' }).selectOption('png');

  // Step 4: Click the export/print button
  // The print/export button is likely labeled "Print" or "Export" or "OK" within the dialog.
  const printButton = page.getByRole('button', { name: /Print|Export|OK/ }).first();
  await expect(printButton).toBeVisible();

  // Wait for the download to start before clicking
  const downloadPromise = page.waitForEvent('download');
  await printButton.click();

  // Assert that a download occurred
  const download = await downloadPromise;
  const suggestedFilename = download.suggestedFilename();
  expect(suggestedFilename).toMatch(/\.png$/i);
});
