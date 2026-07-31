// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  // Navigate to the base URL
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the application to load and map to be ready
  // Assuming the map canvas is available after the initial load
  await page.waitForSelector('canvas', { state: 'visible' });

  // Step 1: Click the 'Print Map' button in the toolbar to open the printing panel.
  // We assume a test id for the print button based on common patterns, 
  // or fall back to a role/text locator if no test id is known.
  // Since specific test ids aren't provided in the prompt, we use getByRole/Text.
  // "Print Map" is likely a button.
  const printButton = page.getByRole('button', { name: 'Print Map' });
  await expect(printButton).toBeVisible();
  await printButton.click();

  // Expected result: The printing panel is visible.
  // We look for a dialog or panel that appeared.
  const printPanel = page.getByRole('dialog', { name: /Print/ }).first();
  // Or potentially a panel with a specific test id if available.
  // Fallback: look for a container that contains "Title" or "Format" fields.
  // Let's assume the dialog opens.
  await expect(printPanel).toBeVisible();

  // Step 2: Enter a title for the printout.
  // Locate the title input field.
  const titleInput = page.getByLabel('Title');
  await expect(titleInput).toBeVisible();
  await titleInput.fill('Test Printout PNG');

  // Step 3: Select the PNG file format.
  // Locate the format selector (likely a select or radio group).
  // Assuming a select element for format.
  const formatSelect = page.getByLabel('Format');
  await expect(formatSelect).toBeVisible();
  await formatSelect.selectOption('PNG');

  // Step 4: Click the export/print button.
  // Locate the export button within the print panel.
  const exportButton = printPanel.getByRole('button', { name: /Export|Print|Generate/ });
  await expect(exportButton).toBeVisible();

  // Set up download listener before triggering the action
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    exportButton.click()
  ]);

  // Expected result: A PNG file containing the current map view is generated and downloaded.
  const suggestedFilename = download.suggestedFilename();
  expect(suggestedFilename).toMatch(/\.png$/);
  
  // Clean up the downloaded file
  await download.delete();
});
