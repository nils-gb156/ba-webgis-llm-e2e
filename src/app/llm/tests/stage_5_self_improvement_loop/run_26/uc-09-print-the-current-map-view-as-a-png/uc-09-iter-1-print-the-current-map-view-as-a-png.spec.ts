// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Precondition: at least one base map and one overlay layer are visible
  // We verify the map is ready by checking the scale viewer is visible
  await expect(page.getByTestId('scale-viewer')).toBeVisible();

  // Step 1: Click the 'Print Map' button to open the printing panel
  // The print-toggle button is already pressed (active) in the initial state,
  // but clicking it again should open the panel if it's closed, or do nothing if already open.
  // Based on the screenshot, the print panel is a dialog.
  // We need to ensure the panel is open. The button has aria-pressed="true" which might mean
  // the panel is already open, or it's just the active tool.
  // Let's click it and then assert the panel is visible.
  await page.getByTestId('print-toggle').click({ force: true });

  // Verify: the printing panel is visible
  // The accessibility tree shows a dialog with name "Print Map"
  await expect(page.getByRole('dialog', { name: 'Print Map' })).toBeVisible();

  // Step 2: Enter a title for the printout
  const titleInput = page.getByRole('textbox', { name: 'Title' });
  await titleInput.fill('My Map Printout');

  // Step 3: Select the PNG file format
  // The combobox is labeled "File format"
  const formatSelect = page.getByRole('combobox', { name: 'File format' });
  await formatSelect.selectOption('PNG');

  // Step 4: Click the export/print button
  // We need to find the export button. It's inside the "Print Map" dialog.
  const exportButton = page.getByRole('dialog', { name: 'Print Map' }).getByRole('button', { name: 'Export map' });

  // Trigger the download
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    exportButton.click()
  ]);

  // Verify: A PNG file is generated and downloaded
  const suggestedFilename = download.suggestedFilename();
  expect(suggestedFilename).toMatch(/\.png$/i);
});
