// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Step 1: The user clicks the 'Print Map' button in the toolbar to open the printing panel.
  const printButton = page.getByRole('button', { name: 'Print Map' });
  await printButton.click();

  // The printing panel is visible.
  await expect(page.getByRole('dialog', { name: 'Print Map' })).toBeVisible();

  // Step 2: The user enters a title for the printout.
  await page.getByRole('dialog', { name: 'Print Map' }).getByRole('textbox', { name: 'Title' }).fill('Map Printout');

  // Step 3: The user selects the PNG file format.
  // The file format is a combobox with options "PNG" and "PDF".
  await page.getByRole('dialog', { name: 'Print Map' }).getByRole('combobox', { name: 'File format' }).selectOption('PNG');

  // Step 4: The user clicks the export/print button.
  // We capture the download event before clicking the export button.
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('dialog', { name: 'Print Map' }).getByRole('button', { name: 'Export map' }).click(),
  ]);

  // A PNG file containing the current map view is generated and downloaded.
  const suggestedFilename = download.suggestedFilename();
  expect(suggestedFilename).toMatch(/\.png$/);
});
