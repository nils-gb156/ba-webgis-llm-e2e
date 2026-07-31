// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready
  await page.waitForSelector('[data-testid="map-container"]');

  // Step 1: Open the printing panel
  await page.getByTestId('print-toggle').click();

  // Verify the printing panel is visible
  // The dialog/panel title is "Print Map"
  await expect(page.getByRole('dialog', { name: 'Print Map' })).toBeVisible();

  // Step 2: Enter a title for the printout
  await page.getByLabel('Title').fill('Test Printout');

  // Step 3: Select the PNG file format
  // The format selector is a combobox/checkbox group. Looking at the screenshot,
  // it seems to be a set of radio buttons or checkboxes.
  // The accessibility tree doesn't show the print dialog contents in the initial state,
  // but the screenshot shows the print dialog is open.
  // We need to find the PNG option. It's likely a radio button or checkbox.
  // Let's try to find a radio button or checkbox with "PNG" in its label.
  // Based on typical UI, it might be a radio group.
  const pngOption = page.getByRole('radio', { name: 'PNG' }).or(
    page.getByRole('checkbox', { name: 'PNG' })
  );
  await expect(pngOption).toBeVisible();
  await pngOption.check();

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
