// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';

test('UC9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Step 1: Open the printing panel
  const printToggle = page.getByRole('button', { name: 'Print Map' });
  await printToggle.click();

  // Verify the printing panel is visible
  await expect(page.getByRole('dialog', { name: 'Print Map' })).toBeVisible();

  // Step 2: Enter a title for the printout
  await page.getByLabel('Title').fill('My Map Printout');

  // Step 3: Select the PNG file format
  await page.getByRole('combobox', { name: 'File format' }).selectOption('PNG');

  // Step 4: Trigger the export
  // Wait for download before clicking the button
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Export map' }).click(),
  ]);

  // Verify the download
  // The filename is derived from the entered title, so it should be "My Map Printout.png"
  expect(download.suggestedFilename()).toBe('My Map Printout.png');
});
