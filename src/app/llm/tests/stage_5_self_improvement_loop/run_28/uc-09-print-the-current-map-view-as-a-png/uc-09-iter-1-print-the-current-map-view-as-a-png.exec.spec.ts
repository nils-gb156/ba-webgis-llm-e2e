// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '../../../failure-snapshot-fixture';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Capture the download event before triggering the action
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Print Map' }).click(),
  ]);

  // Verify the print panel is visible
  await expect(page.getByRole('dialog', { name: 'Print Map' })).toBeVisible();

  // Enter a title for the printout
  await page.getByLabel('Title').fill('My Map Printout');

  // Select the PNG file format
  await page.getByRole('combobox', { name: 'File format' }).selectOption('PNG');

  // Click the export/print button
  await page.getByRole('button', { name: 'Export map' }).click();

  // Verify the file was downloaded
  await expect(download.suggestedFilename()).toMatch(/.*\.png$/);
});
