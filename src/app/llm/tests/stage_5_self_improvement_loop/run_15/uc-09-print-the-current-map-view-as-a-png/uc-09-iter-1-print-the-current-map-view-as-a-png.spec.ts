// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready and at least one overlay to be rendered
  await expect(page.getByTestId('eucos-stations-legend')).toBeVisible();

  // Step 1: Open the printing panel
  await page.getByTestId('print-toggle').click();

  // Verify the printing panel is visible
  await expect(page.getByRole('dialog', { name: 'Print Map' })).toBeVisible();

  // Step 2: Enter a title for the printout
  await page.getByRole('textbox', { name: 'Title' }).fill('Test Map Printout');

  // Step 3: Select the PNG file format
  // The format is selected via a combobox, not radio buttons
  await page.getByRole('combobox', { name: 'File format' }).selectOption('PNG');

  // Step 4: Trigger the export/print
  // The button is labeled "Export map" inside the dialog
  const exportButton = page.getByRole('button', { name: 'Export map' });
  await expect(exportButton).toBeEnabled();

  // Wait for the download to start
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    exportButton.click(),
  ]);

  // Verify the download happened and has a plausible PNG filename
  const suggestedFilename = download.suggestedFilename();
  expect(suggestedFilename).toMatch(/\.png$/i);
});
