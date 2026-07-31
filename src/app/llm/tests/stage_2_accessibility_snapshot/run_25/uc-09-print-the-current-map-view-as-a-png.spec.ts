// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  // Precondition: The app is loaded successfully.
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map and controls to be ready
  await expect(page.getByTestId('map-container')).toBeVisible();
  await expect(page.getByTestId('layer-switcher')).toBeVisible();
  await expect(page.getByTestId('legend')).toBeVisible();

  // Step 1: The user clicks the 'Print Map' button in the toolbar to open the printing panel.
  const printToggle = page.getByRole('button', { name: 'Print Map' });
  await expect(printToggle).toBeVisible();
  
  // Click the print toggle. It might be pressed or not, but we expect the panel to appear.
  await printToggle.click();

  // Expected result: The printing panel is visible.
  // We look for a dialog or panel associated with the print action.
  // Since there is no specific testid for the print panel, we look for the print toggle state or a dialog.
  // Often print dialogs are modal dialogs. Let's look for a dialog with "Print" in the name or similar.
  // If no specific testid exists, we might rely on the presence of form elements typical for printing.
  // However, looking at the context, there is no explicit "print-dialog" testid.
  // We will assume the print toggle being pressed indicates the panel is open, or look for a dialog.
  // Let's try to find a dialog first.
  const printDialog = page.getByRole('dialog', { name: /Print/i });
  
  // If a dialog isn't found by role/name, we might need to look for specific elements that appear.
  // Let's assume the standard behavior is a dialog or a slide-over panel.
  // Given the complexity and lack of specific testid for the panel, we'll check for the presence of
  // a title input and format selector which are part of the steps.
  
  // Let's verify the print interface is accessible.
  // We will wait for a text field that likely represents the title input.
  // Since we don't have exact testids for the print form fields, we use getByLabel.
  const titleInput = page.getByLabel('Title');
  
  // If the dialog is not immediately visible, we might need to wait or check the toggle state.
  // Let's assume the click opened it.
  await expect(titleInput).toBeVisible({ timeout: 5000 });

  // Step 2: The user enters a title for the printout.
  await titleInput.fill('My Map Printout');

  // Step 3: The user selects the PNG file format.
  const pngRadio = page.getByRole('radio', { name: 'PNG' });
  await expect(pngRadio).toBeVisible();
  
  // Check if PNG is already selected
  if (!(await pngRadio.isChecked())) {
    await pngRadio.click();
  }

  // Step 4: The user clicks the export/print button.
  // We look for a button labeled "Export" or "Print" or "Download" inside the dialog.
  const exportButton = page.getByRole('button', { name: /Export|Print|Download/i });
  await expect(exportButton).toBeVisible();

  // Wait for the download to start
  const downloadPromise = page.waitForEvent('download');
  await exportButton.click();

  // Expected result: A PNG file containing the current map view is generated and downloaded.
  const download = await downloadPromise;
  const suggestedFilename = download.suggestedFilename();
  
  // Assert that a file was downloaded and it has a .png extension
  expect(suggestedFilename).toMatch(/\.png$/);

  // Note: We cannot assert the *content* of the downloaded image (visible base map, overlay layers, scale bar)
  // easily in Playwright without external image processing libraries. The test verifies the successful
  // initiation and completion of the download process for a PNG file.
});
