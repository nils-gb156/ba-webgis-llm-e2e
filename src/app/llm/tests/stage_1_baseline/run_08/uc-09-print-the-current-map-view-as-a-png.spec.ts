// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  // Navigate to the base URL
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the application to load and map to be ready
  // Assuming a test id for the map container or a loading indicator
  await page.waitForSelector('[data-testid="map-container"]', { state: 'visible' });

  // Step 1: Click the 'Print Map' button in the toolbar
  const printButton = page.getByRole('button', { name: 'Print Map' });
  await printButton.click();

  // Verify the printing panel is visible
  // Assuming the panel has a specific test id or role
  const printPanel = page.getByRole('dialog', { name: /Print/ }).or(page.getByTestId('print-panel'));
  await expect(printPanel).toBeVisible();

  // Step 2: Enter a title for the printout
  // Assuming there is a text input for the title
  const titleInput = page.getByLabel('Title').or(page.getByTestId('print-title-input'));
  await titleInput.fill('Test Printout');

  // Step 3: Select the PNG file format
  // Assuming radio buttons or a select for format
  const pngFormatOption = page.getByRole('radio', { name: 'PNG' }).or(page.getByTestId('format-png'));
  await pngFormatOption.click();

  // Step 4: Click the export/print button
  const exportButton = page.getByRole('button', { name: /Export|Print/ }).or(page.getByTestId('print-export-button'));
  
  // Set up download listener before clicking
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    exportButton.click()
  ]);

  // Verify the file was downloaded
  const suggestedFilename = download.suggestedFilename();
  expect(suggestedFilename).toMatch(/\.png$/);

  // Clean up the downloaded file
  await download.delete();
});
