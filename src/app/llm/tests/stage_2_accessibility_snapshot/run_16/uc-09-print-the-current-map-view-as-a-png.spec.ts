// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Precondition check: Ensure base map and overlays are visible
  await expect(page.getByTestId('map-container')).toBeVisible();
  await expect(page.getByRole('checkbox', { name: 'EUCOS Ground Stations' })).toBeChecked();
  await expect(page.getByRole('checkbox', { name: 'Temperature' })).toBeChecked();

  // Step 1: Click the 'Print Map' button in the toolbar
  const printButton = page.getByRole('button', { name: 'Print Map' });
  await printButton.click();

  // Expected result: The printing panel is visible.
  // The printing panel is typically a dialog or a specific region.
  // Based on the context, we look for a dialog or a panel that appears.
  // Since no specific testid for the print dialog is listed, we rely on the button name or role.
  // Often print dialogs have a specific title or role. Let's assume it's a dialog.
  const printDialog = page.getByRole('dialog', { name: /Print/i });
  await expect(printDialog).toBeVisible();

  // Step 2: Enter a title for the printout.
  // We need to find the title input. Usually labeled "Title" or similar.
  const titleInput = printDialog.getByLabel('Title');
  await titleInput.fill('Test Map Print');

  // Step 3: Select the PNG file format.
  // We need to find the format selector. It might be a radio group or a dropdown.
  // Let's look for a radio button or option for PNG.
  const pngOption = printDialog.getByRole('radio', { name: 'PNG' });
  // If PNG is already selected, we might not need to click, but let's ensure it is.
  // If it's a radio, we click it to select.
  await pngOption.click();

  // Step 4: Click the export/print button.
  const exportButton = printDialog.getByRole('button', { name: /Export|Print/i });
  
  // Prepare for download
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    exportButton.click()
  ]);

  // Expected result: A PNG file containing the current map view is generated and downloaded.
  const suggestedFilename = download.suggestedFilename();
  expect(suggestedFilename).toMatch(/\.png$/);
  
  // Clean up the downloaded file
  await download.delete();
});
