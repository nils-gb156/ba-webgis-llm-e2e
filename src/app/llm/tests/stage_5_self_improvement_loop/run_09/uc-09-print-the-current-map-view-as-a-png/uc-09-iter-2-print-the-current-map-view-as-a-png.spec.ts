// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Step 1: Open the printing panel
  await page.getByTestId('print-toggle').click();

  // Verify the printing panel is visible
  await expect(page.getByTestId('printing-panel')).toBeVisible();

  // Step 2: Enter a title for the printout
  await page.getByRole('textbox', { name: 'Title' }).fill('Test Printout');

  // Step 3: Select the PNG file format
  await page.getByRole('combobox', { name: 'File format' }).selectOption('PNG');

  // Step 4: Trigger the export/print
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Export map' }).click(),
  ]);

  // Verify the download was triggered and has the correct file name
  await expect(download.suggestedFilename()).resolves.toMatch(/Test Printout\.png$/);
});
