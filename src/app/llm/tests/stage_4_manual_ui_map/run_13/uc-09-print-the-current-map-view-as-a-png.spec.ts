// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Step 1: The user clicks the 'Print Map' button in the toolbar to open the printing panel.
  const printToggle = page.getByTestId('print-toggle');
  
  // Check current state to avoid toggling if already open
  const printingPanel = page.getByTestId('printing-panel');
  const isPrintingPanelVisible = await printingPanel.isVisible();

  if (!isPrintingPanelVisible) {
    await printToggle.click();
  }

  // Assert printing panel is visible
  await expect(printingPanel).toBeVisible();

  // Step 2: The user enters a title for the printout.
  // The printing panel contains an input for the title. We look for a text input inside the panel.
  const titleInput = printingPanel.getByRole('textbox', { name: /title/i });
  await expect(titleInput).toBeVisible();
  await titleInput.fill('Test Map Print');

  // Step 3: The user selects the PNG file format.
  // Look for a radio button or select for format.
  const formatSelector = printingPanel.getByRole('radiogroup', { name: /format/i }).locator('input[type="radio"]');
  const pngOption = formatSelector.filter({ hasText: 'PNG' });
  
  // Check if PNG is already selected
  if (!(await pngOption.isChecked())) {
    await pngOption.click();
  }

  // Step 4: The user clicks the export/print button.
  const exportButton = printingPanel.getByRole('button', { name: /export|print/i });
  await expect(exportButton).toBeVisible();

  // Wait for download to start before clicking
  const downloadPromise = page.waitForEvent('download');
  await exportButton.click();

  // Assert download
  const download = await downloadPromise;
  const suggestedFilename = download.suggestedFilename();
  expect(suggestedFilename).toMatch(/\.png$/i);
});
