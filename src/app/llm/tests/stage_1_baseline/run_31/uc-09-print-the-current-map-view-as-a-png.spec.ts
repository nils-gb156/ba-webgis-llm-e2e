// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready and layers to be visible
  await expect(page.getByTestId('map-container')).toBeVisible();

  // Step 1: Open the printing panel
  const printButton = page.getByRole('button', { name: 'Print Map', exact: true });
  await printButton.click();

  // Verify the printing panel is visible
  await expect(page.getByRole('dialog', { name: /Print/ })).toBeVisible();

  // Step 2: Enter a title for the printout
  const titleInput = page.getByRole('dialog', { name: /Print/ }).getByLabel('Title', { exact: true });
  await titleInput.fill('My Map Printout');

  // Step 3: Select the PNG file format
  // Assuming the format selection is a radio group or dropdown with "PNG" as an option
  const pngOption = page.getByRole('dialog', { name: /Print/ }).getByRole('radio', { name: 'PNG', exact: true });
  if (await pngOption.isChecked()) {
    // If already checked, we don't need to click, but we verify it is checked
    await expect(pngOption).toBeChecked();
  } else {
    await pngOption.click();
    await expect(pngOption).toBeChecked();
  }

  // Step 4: Trigger the export/print action
  const exportButton = page.getByRole('dialog', { name: /Print/ }).getByRole('button', { name: 'Export', exact: true });
  
  // Wait for the download to start
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    exportButton.click()
  ]);

  // Verify the download was successful and has the correct filename
  const suggestedFilename = download.suggestedFilename();
  expect(suggestedFilename).toMatch(/\.png$/);
  
  // Ensure the download completes
  await download.saveAs('/tmp/test-download.png');
  
  // Verify the file exists and is not empty
  const fs = require('fs');
  const stats = fs.statSync('/tmp/test-download.png');
  expect(stats.size).toBeGreaterThan(0);
});
