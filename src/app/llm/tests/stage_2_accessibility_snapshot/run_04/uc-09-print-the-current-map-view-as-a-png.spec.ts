// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready and layers to be visible
  await expect(page.getByTestId('map-container')).toBeVisible();
  await expect(page.getByRole('checkbox', { name: 'Temperature' })).toBeChecked();
  await expect(page.getByRole('checkbox', { name: 'EUCOS Ground Stations' })).toBeChecked();

  // Step 1: Open the printing panel
  const printToggle = page.getByRole('button', { name: 'Print Map' });
  await printToggle.click();

  // Verify the printing panel is visible.
  // The prompt does not provide a specific test-id for the print dialog/panel,
  // so we infer it from the presence of expected controls like title input and format selection.
  // We look for a dialog or panel that contains a title input.
  const printPanel = page.getByRole('dialog', { name: /print/i }).or(page.getByRole('region', { name: /print/i }));
  
  // Since we can't be sure of the exact role/name without inspecting, let's look for the title input
  // which is a strong indicator of the print panel being open.
  // We'll assume the print panel contains a textbox for the title.
  const titleInput = page.getByLabel(/title/i).or(page.getByRole('textbox', { name: /title/i }));
  
  // Wait for the print panel to appear by waiting for the title input
  await expect(titleInput).toBeVisible({ timeout: 5000 });

  // Step 2: Enter a title for the printout
  await titleInput.fill('My Map Printout');

  // Step 3: Select the PNG file format
  // Look for a radio button or combobox for format selection
  const pngOption = page.getByRole('radio', { name: 'PNG' }).or(page.getByRole('option', { name: 'PNG' }));
  
  if (await pngOption.isVisible()) {
    await pngOption.click();
  } else {
    // Fallback: if it's a combobox, select PNG
    const formatSelector = page.getByLabel(/format/i).or(page.getByRole('combobox', { name: /format/i }));
    if (await formatSelector.isVisible()) {
      await formatSelector.selectOption('PNG');
    }
  }

  // Step 4: Click the export/print button
  const exportButton = page.getByRole('button', { name: /export|print|generate/i });
  
  // Prepare for download
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    exportButton.click()
  ]);

  // Verify the download happened and has the correct filename
  const suggestedFilename = download.suggestedFilename();
  expect(suggestedFilename).toMatch(/\.png$/i);
});
