// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '../../../failure-snapshot-fixture';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // 1. The user clicks the 'Print Map' button in the toolbar to open the printing panel.
  await page.getByRole('button', { name: 'Print Map' }).click();

  // 2. The printing panel is visible
  await expect(page.getByRole('dialog', { name: 'Print Map' })).toBeVisible();

  // 3. The user enters a title for the printout.
  await page.getByRole('textbox', { name: 'Title' }).fill('Map Printout');

  // 4. The user selects the PNG file format.
  // The format is a combobox, not radio buttons.
  await page.getByRole('combobox', { name: 'File format' }).selectOption('PNG');

  // 5. The user clicks the export/print button.
  // Capture the download event before triggering the action.
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Export map' }).click(),
  ]);

  // 6. Assert the download happened and has the correct suggested filename
  expect(download.suggestedFilename()).toMatch(/\.png$/);
});
