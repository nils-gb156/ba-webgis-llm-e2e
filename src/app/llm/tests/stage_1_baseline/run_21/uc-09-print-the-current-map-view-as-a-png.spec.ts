// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  // Precondition: The app is loaded successfully.
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready and layers to be visible.
  // We assume standard test ids for the map container or wait for a known element.
  // Since no specific test ids are provided in the prompt, we rely on role/text
  // or wait for the page to be interactive.
  await expect(page.locator('main')).toBeVisible();

  // Precondition: At least one base map and one overlay layer are visible.
  // We assume the default state satisfies this or that the map canvas becomes visible.
  const mapCanvas = page.locator('canvas');
  await expect(mapCanvas).toBeVisible({ timeout: 10000 });

  // Step 1: The user clicks the 'Print Map' button in the toolbar to open the printing panel.
  const printButton = page.getByRole('button', { name: 'Print Map' });
  await expect(printButton).toBeVisible();
  await printButton.click();

  // Expected result: The printing panel is visible.
  // We look for a dialog or panel that contains print-related fields.
  const printPanel = page.getByRole('dialog', { name: /Print/i }).first();
  // Fallback if dialog role is not used, look for a panel with print controls
  const printPanelFallback = page.locator('[data-testid="print-panel"]').first();
  const panel = printPanel.isVisible() ? printPanel : printPanelFallback;
  await expect(panel).toBeVisible({ timeout: 5000 });

  // Step 2: The user enters a title for the printout.
  const titleInput = panel.getByLabel('Title');
  await expect(titleInput).toBeVisible();
  await titleInput.fill('Test Printout PNG');

  // Step 3: The user selects the PNG file format.
  // Look for a radio group or select for format.
  const formatSelector = panel.getByRole('radiogroup', { name: /Format/i }).first()
    .or(panel.getByRole('combobox', { name: /Format/i }).first());
  
  // Try radio buttons first
  const pngRadio = panel.getByRole('radio', { name: 'PNG' });
  if (await pngRadio.isVisible()) {
    // Check if it's already checked
    const isChecked = await pngRadio.isChecked();
    if (!isChecked) {
      await pngRadio.click();
    }
  } else {
    // Try select/combobox
    if (formatSelector) {
      await expect(formatSelector).toBeVisible();
      await formatSelector.selectOption('PNG');
    } else {
      // Fallback: try to find any PNG option
      const pngOption = panel.getByText('PNG');
      await expect(pngOption).toBeVisible();
      // Clicking the text might work if it's a clickable option
      await pngOption.click();
    }
  }

  // Step 4: The user clicks the export/print button.
  const exportButton = panel.getByRole('button', { name: /Export|Print/i });
  await expect(exportButton).toBeVisible();

  // Wait for the download to start before clicking
  const downloadPromise = page.waitForEvent('download');
  await exportButton.click();

  // Expected result: A PNG file containing the current map view is generated and downloaded.
  const download = await downloadPromise;
  const suggestedFilename = download.suggestedFilename();
  
  // Verify it's a PNG file
  expect(suggestedFilename).toMatch(/\.png$/i);

  // Save the file to verify it's not corrupted (optional but good practice)
  const path = await download.path();
  expect(path).toBeTruthy();
  
  // Verify file size is greater than 0
  const fs = require('fs');
  const stats = fs.statSync(path!);
  expect(stats.size).toBeGreaterThan(0);
});
