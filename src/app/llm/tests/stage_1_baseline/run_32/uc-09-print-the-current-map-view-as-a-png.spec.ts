// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  // Navigate to the application
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready and layers to be visible
  // We assume the map container exists and has some content after a short wait
  const mapContainer = page.locator('canvas');
  await expect(mapContainer).toBeVisible();

  // Wait for the printing tool button to be available in the toolbar
  const printButton = page.getByRole('button', { name: 'Print Map' });
  await expect(printButton).toBeVisible();

  // Set up the download listener before triggering the action
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    printButton.click()
  ]);

  // Verify the printing panel is visible
  const printingPanel = page.getByRole('dialog', { name: /Print/i });
  await expect(printingPanel).toBeVisible();

  // Enter a title for the printout
  const titleInput = printingPanel.getByLabel('Title');
  await titleInput.fill('Test Printout');

  // Select the PNG file format
  // Assuming radio buttons or a select for format. Using radio as it's common for format selection.
  const pngFormatOption = printingPanel.getByRole('radio', { name: 'PNG' });
  await expect(pngFormatOption).toBeVisible();
  await pngFormatOption.check();

  // Click the export/print button
  const exportButton = printingPanel.getByRole('button', { name: /Export|Print/i });
  await expect(exportButton).toBeVisible();
  await exportButton.click();

  // Verify the file was downloaded and is a PNG
  const suggestedFilename = download.suggestedFilename();
  expect(suggestedFilename.toLowerCase()).toMatch(/\.png$/);

  // Optional: Verify the file size is non-zero to ensure it's a valid file
  const filePath = await download.path();
  if (filePath) {
    const fs = require('fs');
    const stats = fs.statSync(filePath);
    expect(stats.size).toBeGreaterThan(0);
  }
});
