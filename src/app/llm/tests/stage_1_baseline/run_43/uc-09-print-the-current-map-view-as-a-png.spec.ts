// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  // Navigate to the application
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready and layers to be visible
  // Assuming the map canvas is present and some initial loading is done
  await expect(page.locator('canvas')).toBeVisible({ timeout: 30000 });

  // Step 1: Click the 'Print Map' button in the toolbar
  // Using a test id if available, otherwise by role/text.
  // Based on common patterns, we look for a print icon or text in the toolbar.
  // Let's assume a test id 'print-map-btn' exists for the print tool toggle/button.
  // If not, we fallback to getByRole('button', { name: /Print/i })
  const printButton = page.getByTestId('print-map-btn').or(page.getByRole('button', { name: /Print/i }));
  await printButton.click();

  // Verify the printing panel is visible
  // Assuming the panel has a test id or accessible name
  const printPanel = page.getByTestId('print-panel').or(page.getByRole('dialog', { name: /Print/i }).or(page.getByRole('region', { name: /Print/i })));
  await expect(printPanel).toBeVisible({ timeout: 10000 });

  // Step 2: Enter a title for the printout
  // Assuming there is a text input for the title with a test id or label
  const titleInput = page.getByTestId('print-title-input').or(page.getByLabel('Title'));
  await titleInput.fill('My Map Export');

  // Step 3: Select the PNG file format
  // Assuming there is a radio group or select for format.
  // Let's assume radio buttons with test ids or labels for 'PNG' and 'PDF'
  const pngFormatOption = page.getByTestId('print-format-png').or(page.getByRole('radio', { name: 'PNG' }));
  await pngFormatOption.click();

  // Verify PNG is selected (if using radio buttons, check checked state)
  await expect(pngFormatOption).toBeChecked();

  // Step 4: Click the export/print button
  // Assuming a button to trigger the download
  const exportButton = page.getByTestId('print-export-btn').or(page.getByRole('button', { name: /Export/i }).or(page.getByRole('button', { name: /Print/i })));
  
  // Wait for the download event before clicking
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    exportButton.click()
  ]);

  // Verify the download happened and has a PNG extension
  const suggestedFilename = download.suggestedFilename();
  expect(suggestedFilename).toMatch(/\.png$/i);

  // Clean up the downloaded file
  await download.delete();
});
