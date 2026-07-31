// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('UC9: Print the current map view as a PNG', async ({ page }) => {
  // Navigate to the application
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready and layers to be visible.
  // We poll the map helper to ensure the map is initialized and has content.
  // Note: We assume standard test ids for the map container if provided, 
  // otherwise we rely on the map canvas being present.
  // Since no specific map helper was provided in the prompt, we wait for the map canvas.
  await page.getByRole('document').getByRole('presentation', { name: /map/i }).first().waitFor({ state: 'visible' });

  // Step 1: The user clicks the 'Print Map' button in the toolbar to open the printing panel.
  const printButton = page.getByRole('button', { name: /Print Map/i });
  await expect(printButton).toBeVisible();
  await printButton.click();

  // Verify the printing panel is visible
  const printPanel = page.getByRole('dialog', { name: /Print/i }).or(page.getByTestId('print-panel'));
  await expect(printPanel).toBeVisible();

  // Step 2: The user enters a title for the printout.
  const titleInput = printPanel.getByLabel(/Title/i).or(printPanel.getByTestId('print-title'));
  await expect(titleInput).toBeVisible();
  await titleInput.fill('Test Map Export PNG');

  // Step 3: The user selects the PNG file format.
  const formatSelector = printPanel.getByRole('combobox', { name: /Format/i }).or(printPanel.getByTestId('print-format'));
  await expect(formatSelector).toBeVisible();
  
  // Open the dropdown if it's a select/combobox
  await formatSelector.click();
  
  // Select PNG from the options
  const pngOption = printPanel.getByRole('option', { name: /PNG/i });
  await expect(pngOption).toBeVisible();
  await pngOption.click();

  // Step 4: The user clicks the export/print button.
  // Set up download listener before clicking
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    printPanel.getByRole('button', { name: /Export|Print|Generate/i }).click()
  ]);

  // Verify the download was triggered and has the correct suggested filename
  const suggestedFilename = download.suggestedFilename();
  expect(suggestedFilename).toMatch(/\.png$/);

  // Clean up the downloaded file
  await download.delete();
});
