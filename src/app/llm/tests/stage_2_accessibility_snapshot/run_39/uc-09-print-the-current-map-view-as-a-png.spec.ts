// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Ensure the map is ready and layers are loaded before interacting.
  // The accessibility tree shows checkboxes are checked, so layers are visible.
  await expect(page.getByTestId('map-container')).toBeVisible();

  // Step 1: Click the 'Print Map' button in the toolbar.
  const printButton = page.getByRole('button', { name: 'Print Map' });
  await printButton.click();

  // Step 2: Enter a title for the printout.
  // The printing panel should be visible now.
  // We look for a text input within the print panel/dialog.
  // Since there is no specific test id for the title input, we use getByLabel.
  const titleInput = page.getByLabel('Title');
  await expect(titleInput).toBeVisible();
  await titleInput.fill('Test Map Printout');

  // Step 3: Select the PNG file format.
  // Look for a radio button or select for format.
  const pngFormatOption = page.getByRole('radio', { name: 'PNG' });
  await expect(pngFormatOption).toBeVisible();
  await pngFormatOption.check();

  // Step 4: Click the export/print button.
  // Look for a button that triggers the download.
  const exportButton = page.getByRole('button', { name: /Export|Print|Download/i });
  await expect(exportButton).toBeVisible();

  // Wait for the download to start before clicking.
  const downloadPromise = page.waitForEvent('download');
  await exportButton.click();

  const download = await downloadPromise;
  const suggestedFilename = download.suggestedFilename();

  // Assert that a file was downloaded.
  expect(suggestedFilename).toBeTruthy();
  expect(suggestedFilename.endsWith('.png')).toBe(true);

  // Clean up the downloaded file.
  await download.delete();
});
