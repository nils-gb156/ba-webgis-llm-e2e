// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  // Navigate to the application
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the application to load and map to be ready
  // We assume the map canvas becomes visible when the app is ready
  await expect(page.getByRole('main')).toBeVisible({ timeout: 30000 });

  // Step 1: Click the 'Print Map' button in the toolbar to open the printing panel.
  // We use getByRole with exact name to find the print button in the toolbar.
  const printButton = page.getByRole('button', { name: 'Print Map', exact: true });
  await expect(printButton).toBeVisible();
  await printButton.click();

  // Expected result: The printing panel is visible.
  // We look for a dialog or panel that likely contains the print options.
  // Assuming the panel has a heading or role indicating it's a print dialog/panel.
  const printPanel = page.getByRole('dialog', { name: /Print/i });
  await expect(printPanel).toBeVisible({ timeout: 5000 });

  // Step 2: The user enters a title for the printout.
  // We look for a label or input related to "Title".
  const titleInput = page.getByLabel('Title', { exact: true }).or(page.getByLabel('Print Title'));
  // Fallback if exact label isn't found, try generic text input inside the panel
  const titleField = titleInput.count() > 0 ? titleInput : printPanel.locator('input[type="text"]').first();
  await expect(titleField).toBeVisible();
  await titleField.fill('Test Printout');

  // Step 3: The user selects the PNG file format.
  // We look for a radio group or select for format, with "PNG" as an option.
  // Using getByRole('radio', { name: 'PNG' }) or similar.
  const pngFormatOption = printPanel.getByRole('radio', { name: 'PNG', exact: true }).or(printPanel.getByText('PNG', { exact: true }).first());
  
  // Check if PNG is already selected
  const isPngSelected = await pngFormatOption.evaluate((el) => el.getAttribute('aria-checked') === 'true' || el.classList.contains('chakra-radio__control--checked'));
  
  if (!isPngSelected) {
    // Click the PNG option to select it
    // Note: Chakra radio buttons might need force click if the visual element intercepts
    await pngFormatOption.click({ force: true });
  }

  // Step 4: The user clicks the export/print button.
  // We look for a button inside the print panel that triggers the action.
  const exportButton = printPanel.getByRole('button', { name: /Export|Print|Generate/i, exact: true });
  await expect(exportButton).toBeVisible();

  // Wait for the download to start
  const downloadPromise = page.waitForEvent('download');
  await exportButton.click();

  // Wait for the download to complete and verify it's a PNG
  const download = await downloadPromise;
  const suggestedFilename = download.suggestedFilename();
  expect(suggestedFilename).toMatch(/\.png$/i, 'The downloaded file should be a PNG');

  // Clean up the downloaded file
  await download.delete();
});
