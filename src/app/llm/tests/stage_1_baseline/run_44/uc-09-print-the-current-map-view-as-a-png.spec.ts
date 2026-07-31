// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  // Navigate to the base URL
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the application to load and the map to be ready
  // Assuming the map container or a specific UI element indicates readiness
  await expect(page.getByTestId('map-container')).toBeVisible();

  // Step 1: Click the 'Print Map' button in the toolbar to open the printing panel
  // Assuming the print button has a test id or accessible name
  const printButton = page.getByRole('button', { name: 'Print Map' });
  await expect(printButton).toBeVisible();
  await printButton.click();

  // Verify the printing panel is visible
  const printPanel = page.getByTestId('print-panel');
  await expect(printPanel).toBeVisible();

  // Step 2: Enter a title for the printout
  // Assuming the title input has a test id or accessible label
  const titleInput = page.getByLabel('Title');
  await titleInput.fill('Test Printout');

  // Step 3: Select the PNG file format
  // Assuming the format selector is a radio group or dropdown with test ids or accessible names
  const pngFormatOption = page.getByRole('radio', { name: 'PNG' });
  await expect(pngFormatOption).toBeVisible();
  await pngFormatOption.click();

  // Step 4: Click the export/print button
  const exportButton = page.getByRole('button', { name: 'Export' });
  await expect(exportButton).toBeVisible();

  // Wait for the download to start before clicking
  const downloadPromise = page.waitForEvent('download');
  await exportButton.click();

  // Await the download and verify it
  const download = await downloadPromise;
  const suggestedFilename = download.suggestedFilename();
  expect(suggestedFilename).toMatch(/\.png$/);

  // Save the file to verify it exists and is not empty (optional but good practice)
  const filePath = `/tmp/${suggestedFilename}`;
  await download.saveAs(filePath);
  const fs = require('fs');
  const stats = fs.statSync(filePath);
  expect(stats.size).toBeGreaterThan(0);
});
