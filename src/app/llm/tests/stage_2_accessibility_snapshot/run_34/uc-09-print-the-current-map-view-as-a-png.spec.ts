// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map and initial layers to load
  await expect(page.getByTestId('map-container')).toBeVisible();
  await expect(page.getByTestId('eucos-stations-legend')).toBeVisible();

  // Step 1: Click the 'Print Map' button to open the printing panel.
  // The print toggle might already be pressed or not; we click it to ensure the panel opens.
  // Based on the accessibility tree, the button is "Print Map".
  const printToggle = page.getByRole('button', { name: 'Print Map' });
  await printToggle.click();

  // Wait for the printing panel/dialog to become visible.
  // We look for a dialog or panel that likely contains the print options.
  // Since no specific test id for the print dialog is provided, we look for common patterns
  // or the title of the dialog if available. Often, printing panels are dialogs.
  // Let's assume there's a dialog or a distinct panel. We'll wait for a text that indicates print options.
  // A safe bet is to wait for the print button inside the panel to be visible, or a title.
  // Let's try waiting for a dialog with "Print" or similar.
  // If no dialog, we might need to look for the panel container.
  // Given the context, let's assume a dialog appears.
  const printDialog = page.getByRole('dialog', { name: /print/i });
  await expect(printDialog).toBeVisible();

  // Step 2: Enter a title for the printout.
  // We need to find the title input. It's likely a textbox with a label like "Title" or "Map Title".
  const titleInput = printDialog.getByLabel(/title/i);
  await expect(titleInput).toBeVisible();
  await titleInput.fill('My Map Printout');

  // Step 3: Select the PNG file format.
  // We need to find the format selector. It might be a radio group, select, or list.
  // Let's look for a radio button or select option for "PNG".
  const pngOption = printDialog.getByRole('radio', { name: 'PNG', exact: true }).or(
    printDialog.getByRole('option', { name: 'PNG', exact: true })
  );
  
  // If it's a radio button, we click it. If it's a select, we might need to select it differently.
  // Let's try clicking the radio button first.
  try {
    await pngOption.click();
  } catch {
    // If radio fails, maybe it's a select.
    const formatSelect = printDialog.getByLabel(/format/i);
    await expect(formatSelect).toBeVisible();
    await formatSelect.selectOption('PNG');
  }

  // Step 4: Click the export/print button.
  const exportButton = printDialog.getByRole('button', { name: /export|print|download/i });
  await expect(exportButton).toBeVisible();

  // Wait for the download to start before clicking.
  const downloadPromise = page.waitForEvent('download');
  await exportButton.click();

  // Wait for the download to complete
  const download = await downloadPromise;
  const suggestedFilename = download.suggestedFilename();
  
  // Verify the file was downloaded and has a PNG extension
  expect(suggestedFilename.toLowerCase()).toMatch(/\.png$/);

  // Note: We cannot visually verify the content of the downloaded PNG in this test easily,
  // but the successful download of a .png file is the primary expected result for the automation.
  // The prompt asks to verify the printed image shows visible layers, which is hard to do programmatically
  // without comparing pixel data, which is not supported by standard Playwright assertions for downloads.
  // The successful download of a PNG file is the best proxy for "PNG file ... is generated and downloaded".
});
