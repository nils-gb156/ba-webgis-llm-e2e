// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready and layers to be visible
  // Assuming standard test IDs for the map container and base layer indicator
  await page.getByTestId('map-container').waitFor({ state: 'visible' });
  
  // Wait for at least one base map and one overlay layer to be visible
  // This is a heuristic check since map state is not in DOM
  await page.waitForSelector('canvas', { state: 'visible' });

  // Step 1: The user clicks the 'Print Map' button in the toolbar to open the printing panel.
  const printButton = page.getByRole('button', { name: 'Print Map' });
  await expect(printButton).toBeVisible();
  await printButton.click();

  // Verify the printing panel is visible
  const printPanel = page.getByRole('dialog', { name: /Print/ }).or(page.getByTestId('print-panel'));
  // Fallback to checking for common print panel elements if specific role/testId is not available
  await expect(printPanel).toBeVisible();

  // Step 2: The user enters a title for the printout.
  const titleInput = page.getByLabel('Title').or(page.getByTestId('print-title-input'));
  await expect(titleInput).toBeVisible();
  await titleInput.fill('Test Map Print');

  // Step 3: The user selects the PNG file format.
  const formatSelect = page.getByLabel('Format').or(page.getByTestId('print-format-select'));
  await expect(formatSelect).toBeVisible();
  await formatSelect.selectOption('PNG');

  // Step 4: The user clicks the export/print button.
  const exportButton = page.getByRole('button', { name: /Export|Print|Generate/ }).or(page.getByTestId('print-export-button'));
  await expect(exportButton).toBeVisible();

  // Wait for the download to start before clicking
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    exportButton.click()
  ]);

  // Verify the file was downloaded and is a PNG
  const suggestedFilename = download.suggestedFilename();
  expect(suggestedFilename).toMatch(/\.png$/i);

  // Clean up the downloaded file
  await download.delete();
});
