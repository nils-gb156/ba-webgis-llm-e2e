// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  // Navigate to the base URL
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the application to load and map to be ready
  // Assuming there's a main map container or a specific loading indicator
  await expect(page.getByTestId('map-container')).toBeVisible();

  // Step 1: Click the 'Print Map' button in the toolbar to open the printing panel.
  const printButton = page.getByRole('button', { name: 'Print Map' });
  await printButton.click();

  // Expected result: The printing panel is visible.
  await expect(page.getByRole('dialog', { name: /Print/ })).toBeVisible();
  // Alternatively, if the panel is a side panel or has a specific test id:
  // await expect(page.getByTestId('print-panel')).toBeVisible();

  // Step 2: Enter a title for the printout.
  const titleInput = page.getByRole('textbox', { name: 'Title' });
  // If no accessible name, try by label or test id
  // const titleInput = page.getByTestId('print-title-input');
  await titleInput.fill('Map Export Test');

  // Step 3: Select the PNG file format.
  // Assuming there's a radio group or select for format
  const pngFormatOption = page.getByRole('radio', { name: 'PNG' });
  // If radio buttons are not directly accessible, try checkbox or select
  // const pngFormatOption = page.getByRole('option', { name: 'PNG' });
  // const pngFormatOption = page.getByTestId('format-png');
  
  // Check if PNG is already selected to avoid unnecessary clicks or state issues
  const isPngSelected = await pngFormatOption.isChecked();
  if (!isPngSelected) {
    await pngFormatOption.click();
  }

  // Step 4: Click the export/print button.
  const exportButton = page.getByRole('button', { name: /Export|Print|Generate/ });
  // If the button has a specific test id
  // const exportButton = page.getByTestId('print-export-button');
  
  // Wait for the download to start before clicking the button
  const downloadPromise = page.waitForEvent('download');
  await exportButton.click();

  // Expected result: A PNG file containing the current map view is generated and downloaded.
  const download = await downloadPromise;
  const suggestedFilename = download.suggestedFilename();
  
  // Verify the file is a PNG
  expect(suggestedFilename.toLowerCase()).toMatch(/\.png$/);

  // Note: Verifying the content of the downloaded image (base map, overlay, scale bar)
  // is difficult in E2E without additional libraries to parse the binary image data.
  // We primarily assert the successful download of a PNG file.
  expect(download.suggestedFilename()).toBeTruthy();
});
