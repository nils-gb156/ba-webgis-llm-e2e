// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  // Navigate to the application
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map and UI to be ready
  await page.waitForLoadState('networkidle');
  // Wait for the map canvas to appear, indicating the map is initialized
  await page.getByRole('img', { name: '' }).first().waitFor({ state: 'visible' });

  // Step 1: The user clicks the 'Print Map' button in the toolbar to open the printing panel.
  // Locate the print button by its accessible name or test id if available.
  // Assuming a test id or accessible name exists for the print tool.
  const printButton = page.getByRole('button', { name: 'Print Map' }).or(page.getByTestId('print-map-button'));
  await printButton.click();

  // Expected result: The printing panel is visible.
  // We look for a dialog or panel that contains print-related controls.
  const printPanel = page.getByRole('dialog', { name: /Print|Printing/i }).or(page.getByTestId('print-panel'));
  await expect(printPanel).toBeVisible();

  // Step 2: The user enters a title for the printout.
  // Locate the title input field within the print panel.
  const titleInput = printPanel.getByLabel('Title').or(printPanel.getByTestId('print-title-input'));
  await titleInput.fill('My Map Printout');

  // Step 3: The user selects the PNG file format.
  // Locate the format selector, likely a radio group or dropdown.
  const pngFormatOption = printPanel.getByRole('radio', { name: 'PNG' }).or(printPanel.getByText('PNG'));
  
  // Check if PNG is already selected to avoid unnecessary clicks or state issues
  const isPngSelected = await pngFormatOption.isChecked();
  if (!isPngSelected) {
    await pngFormatOption.click({ force: true }); // Force click for Chakra UI radios if needed
  }

  // Step 4: The user clicks the export/print button.
  // Set up the download listener before triggering the action.
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    printPanel.getByRole('button', { name: /Export|Print|Generate/i }).click()
  ]);

  // Expected result: A PNG file containing the current map view is generated and downloaded.
  const suggestedFilename = download.suggestedFilename();
  expect(suggestedFilename).toMatch(/\.png$/i);

  // Clean up the downloaded file to avoid clutter
  await download.delete();
});
