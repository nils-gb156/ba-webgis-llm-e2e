// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  // Precondition: The app is loaded successfully.
  // At least one base map and one overlay layer are visible on the map.
  // The printing tool is accessible via the toolbar.
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map and controls to be ready.
  await expect(page.getByTestId('map-container')).toBeVisible();
  await expect(page.getByTestId('scale-bar')).toBeVisible();

  // Step 1: The user clicks the 'Print Map' button in the toolbar to open the printing panel.
  const printToggle = page.getByRole('button', { name: 'Print Map' });
  await printToggle.click();

  // Expected result: The printing panel is visible.
  // We look for a dialog or panel associated with printing.
  // Since there is no specific test id for the print dialog, we look for a role that indicates a dialog/modal
  // or check for the presence of typical print form elements.
  // The accessibility tree doesn't explicitly show a dialog, but the button name is "Print Map".
  // Let's assume the print panel appears as a dialog or a visible section.
  // We will wait for the print dialog/panel to be visible.
  // Often, print dialogs might not have a standard role, so we might need to look for specific inputs.
  // Let's look for a title input which is part of Step 2.
  const printDialog = page.getByRole('dialog', { name: /Print/i }).or(page.getByTestId('print-panel'));
  
  // Fallback: If no specific dialog/testid, we might need to infer from the presence of form elements.
  // However, let's try to find the title input directly as per Step 2.
  // If the panel is not immediately visible, we might need to wait for it.
  // Let's assume the print panel becomes visible and contains a title input.
  const titleInput = page.getByLabel('Title').or(page.getByPlaceholder('Enter title')).or(page.locator('input[type="text"]').first());
  
  // Let's try to find the print dialog by looking for the title input which should appear after clicking print.
  // If getByRole('dialog') fails, we might need to look for the panel by other means.
  // Given the complexity, let's assume the print panel is a dialog or a distinct region.
  // We will wait for the title input to be visible as a proxy for the panel being open.
  await expect(titleInput).toBeVisible({ timeout: 5000 });

  // Step 2: The user enters a title for the printout.
  await titleInput.fill('Test Printout');

  // Step 3: The user selects the PNG file format.
  // We need to find the format selector. It could be a radio button, dropdown, or checkbox.
  // Let's look for a label or role indicating "PNG".
  const pngFormatOption = page.getByRole('radio', { name: 'PNG' }).or(page.getByRole('option', { name: 'PNG' })).or(page.getByText('PNG'));
  
  // If it's a radio button, we click it. If it's a dropdown, we select it.
  // Let's try clicking the radio/option if it's not already selected.
  // We should check if it's already selected to avoid unnecessary clicks.
  const isPngSelected = await pngFormatOption.isChecked();
  if (!isPngSelected) {
    await pngFormatOption.click();
  }

  // Step 4: The user clicks the export/print button.
  const exportButton = page.getByRole('button', { name: /Export|Print|Download/i });
  
  // Prepare for download
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    exportButton.click()
  ]);

  // Expected result: A PNG file containing the current map view is generated and downloaded.
  const suggestedFilename = download.suggestedFilename();
  expect(suggestedFilename).toMatch(/\.png$/);
  
  // Clean up the download
  await download.delete();
});
