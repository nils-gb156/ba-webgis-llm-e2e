// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready and layers to be visible
  await expect(page.getByTestId('map-container')).toBeVisible();

  // Step 1: Click the 'Print Map' button in the toolbar
  const printButton = page.getByRole('button', { name: 'Print Map' });
  await printButton.click();

  // Verify the printing panel is visible
  const printPanel = page.getByRole('dialog', { name: /Print/i });
  await expect(printPanel).toBeVisible();

  // Step 2: Enter a title for the printout
  const titleInput = printPanel.getByLabel('Title');
  await titleInput.fill('Test Map Printout');

  // Step 3: Select the PNG file format
  // Assuming the format selector is a radio group or dropdown.
  // If it's a dropdown:
  const formatSelect = printPanel.getByLabel('Format');
  await formatSelect.selectOption('png');

  // If it's a radio group, we would do:
  // await printPanel.getByRole('radio', { name: 'PNG' }).click();

  // Step 4: Click the export/print button
  const exportButton = printPanel.getByRole('button', { name: /Export|Print|Generate/i });
  
  // Wait for the download to start before clicking
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    exportButton.click()
  ]);

  // Verify the download succeeded and has a PNG extension
  const suggestedFilename = download.suggestedFilename();
  expect(suggestedFilename).toMatch(/\.png$/);

  // Clean up the downloaded file
  await download.delete();
});
