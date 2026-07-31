// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  // Navigate to the application
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to load and layers to be visible.
  // We assume the map container has a test id or we can wait for a known element.
  // Since no specific test ids are provided in the prompt for the map container,
  // we wait for the page to be fully loaded and assume the map initializes.
  await page.waitForLoadState('networkidle');

  // Step 1: Click the 'Print Map' button in the toolbar.
  // We look for a button with the text "Print Map" or an accessible name.
  const printButton = page.getByRole('button', { name: 'Print Map' });
  await expect(printButton).toBeVisible();
  await printButton.click();

  // Step 2: The printing panel should become visible.
  // We look for a dialog or panel with a title related to printing.
  const printPanel = page.getByRole('dialog', { name: /Print/i }).first();
  // Fallback if dialog role isn't used, check for a panel containing "Print"
  const printPanelAlternative = page.locator('[role="dialog"]').filter({ hasText: 'Print' }).first();
  const targetPrintPanel = printPanel.isVisible() ? printPanel : printPanelAlternative;
  await expect(targetPrintPanel).toBeVisible();

  // Step 3: Enter a title for the printout.
  // We look for a label or input related to "Title".
  const titleLabel = page.getByLabel('Title');
  await expect(titleLabel).toBeVisible();
  await titleLabel.fill('Test Printout PNG');

  // Step 4: Select the PNG file format.
  // We look for a radio button or dropdown for format selection.
  // Assuming a radio group or select for format.
  const pngFormatOption = page.getByRole('radio', { name: 'PNG' }).first();
  // If radio is not available, try checkbox or select option
  const pngFormatAlternative = page.getByRole('option', { name: 'PNG' }).first();
  
  if (pngFormatOption.isVisible()) {
    await pngFormatOption.click();
  } else if (pngFormatAlternative.isVisible()) {
    // If it's a select, we might need to click the select box first
    const selectBox = pngFormatAlternative.locator('..').locator('..').getByRole('combobox').first();
    await selectBox.click();
    await pngFormatAlternative.click();
  } else {
    // Fallback: try to find a text-based selection
    const pngText = page.getByText('PNG').first();
    await pngText.click();
  }

  // Step 5: Click the export/print button.
  const exportButton = page.getByRole('button', { name: /Export|Print/i }).first();
  await expect(exportButton).toBeVisible();
  
  // Set up download listener before triggering the action
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    exportButton.click()
  ]);

  // Wait for the download to complete
  await download.path();

  // Verify the download filename suggests it is a PNG
  const suggestedFilename = download.suggestedFilename();
  expect(suggestedFilename.toLowerCase()).toContain('.png');
});
