// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  // Navigate to the base URL
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the application to load and map to be ready
  // Assuming the map canvas or a specific container is present when loaded
  await expect(page.getByTestId('map-container')).toBeVisible({ timeout: 30000 });

  // Step 1: Click the 'Print Map' button in the toolbar to open the printing panel
  const printButton = page.getByRole('button', { name: 'Print Map' });
  await expect(printButton).toBeVisible();
  await printButton.click();

  // Verify the printing panel is visible
  // Assuming the panel has a specific test id or role
  const printPanel = page.getByRole('dialog', { name: /Print/ }).or(page.getByTestId('print-panel'));
  await expect(printPanel).toBeVisible({ timeout: 10000 });

  // Step 2: Enter a title for the printout
  // Assuming there is a text input for the title within the print panel
  const titleInput = printPanel.getByRole('textbox', { name: /Title/i }).or(printPanel.getByTestId('print-title'));
  await expect(titleInput).toBeVisible();
  await titleInput.fill('Test Printout');

  // Step 3: Select the PNG file format
  // Assuming there is a radio group or select for format selection
  const pngFormatOption = printPanel.getByRole('radio', { name: 'PNG' }).or(printPanel.getByTestId('print-format-png'));
  await expect(pngFormatOption).toBeVisible();
  await pngFormatOption.click({ force: true });

  // Step 4: Click the export/print button
  const exportButton = printPanel.getByRole('button', { name: /Export|Print/i }).or(printPanel.getByTestId('print-export'));
  await expect(exportButton).toBeVisible();

  // Set up the download listener before clicking the export button
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    exportButton.click()
  ]);

  // Verify the download was triggered and save the file to verify it exists
  const suggestedFilename = download.suggestedFilename();
  expect(suggestedFilename).toBeTruthy();
  
  // Although we can't visually verify the content of the PNG in this automated test easily,
  // we can verify that a file was downloaded and it's not empty.
  const path = await download.path();
  expect(path).toBeTruthy();
  
  const fs = require('fs');
  if (path) {
    const stats = fs.statSync(path);
    expect(stats.size).toBeGreaterThan(0);
  }
});
