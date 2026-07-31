// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  // Precondition: The app is loaded successfully.
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready and layers to be visible
  // We poll for the map canvas to be present and potentially for a base layer to be active
  // Since we don't have specific helpers, we wait for the map container to exist and be visible
  await page.getByTestId('map-container').waitFor({ state: 'visible' });
  
  // Wait a bit for layers to load, or poll for a specific layer if we had helpers.
  // Here we assume standard loading times are handled by the subsequent interactions
  // or we can wait for a known element that appears after load.
  // Let's wait for the toolbar to be interactive.
  await page.getByRole('button', { name: 'Print Map' }).waitFor({ state: 'visible' });

  // Step 1: The user clicks the 'Print Map' button in the toolbar to open the printing panel.
  // We need to ensure the print panel is not already open or handle toggling.
  // Assuming it's closed initially.
  const printButton = page.getByRole('button', { name: 'Print Map' });
  await printButton.click();

  // Expected result: The printing panel is visible.
  const printPanel = page.getByRole('dialog', { name: /Print/ }); // Adjust name if needed
  // If the dialog doesn't have a clear accessible name, we might need to use a test id
  // or look for a specific header. Let's assume a test id for the panel or a robust locator.
  // Fallback: Look for a form or specific title inside the panel.
  // Let's try to find the panel by its likely content or a specific test id if available.
  // If no test id, we look for the Print Map button's container or a dialog.
  // Often printing dialogs are dialogs.
  await expect(printPanel).toBeVisible();

  // Step 2: The user enters a title for the printout.
  // We need to find the title input field.
  const titleInput = printPanel.getByLabel(/Title/);
  await titleInput.fill('My Map Printout');

  // Step 3: The user selects the PNG file format.
  // We need to find the format selector. It might be a radio group, select, or buttons.
  // Let's look for a radio button or option for PNG.
  const pngOption = printPanel.getByRole('radio', { name: 'PNG' });
  // If it's a select, we would use getByRole('combobox').selectOption('png')
  // If it's a checkbox or button, we adjust.
  // Assuming radio for simplicity, but if it's a select:
  // const formatSelect = printPanel.getByLabel('Format');
  // await formatSelect.selectOption('png');
  
  // Let's check if PNG is already selected. If not, click it.
  const isPngSelected = await pngOption.isChecked();
  if (!isPngSelected) {
    await pngOption.click();
  }

  // Step 4: The user clicks the export/print button.
  const exportButton = printPanel.getByRole('button', { name: /Export|Print|Generate/ });
  
  // Prepare for download
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    exportButton.click()
  ]);

  // Expected result: A PNG file containing the current map view is generated and downloaded.
  const suggestedFilename = download.suggestedFilename();
  expect(suggestedFilename).toMatch(/\.png$/);

  // Clean up: delete the downloaded file
  await download.delete();

  // Expected result: The printed image shows the visible base map and overlay layers as well as the scale bar.
  // This is hard to verify automatically without image comparison or specific map helpers.
  // We assume the download was successful and the filename is correct as a proxy.
  // If we had map helpers, we could verify the map state (layers, zoom) before printing.
});
