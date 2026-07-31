// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for initial map and layers to load
  await expect(page.getByTestId('map-container')).toBeVisible();
  await expect(page.getByTestId('scale-bar')).toBeVisible();

  // Step 1: The user clicks the 'Print Map' button in the toolbar to open the printing panel.
  const printToggle = page.getByRole('button', { name: 'Print Map' });
  await printToggle.click();

  // Verify the printing panel is visible
  // The print toggle is pressed/active when the panel is open
  await expect(printToggle).toHaveAttribute('aria-pressed', 'true');

  // Step 2: The user enters a title for the printout.
  // Looking for a text input within the print panel/dialog for the title.
  // Since no specific test id is provided for the title input, we look for a label or role.
  // Commonly this might be a textbox labeled "Title" or similar.
  // We will look for a textbox inside the context of the print action.
  // Often print dialogs have a title field. Let's assume a generic search for a textbox
  // if specific labels aren't clear, but best practice is specific labels.
  // Given the context, let's try to find a textbox that might be for the title.
  // If there's a dialog/panel open, we should scope to it.
  // However, without a specific test ID for the print panel itself, we rely on the button being pressed.
  // Let's look for a textbox with label "Title" or similar.
  const titleInput = page.getByRole('textbox', { name: /title/i, exact: true });
  
  // If the specific name isn't found, we might need to look for any textbox in the print context.
  // But let's try the specific name first. If it fails, we might need to adjust based on actual DOM.
  // Assuming the UI has a "Title" field.
  await titleInput.fill('My Map Printout');

  // Step 3: The user selects the PNG file format.
  // Look for a radio button or dropdown for format selection.
  // Commonly "PNG" or "Format" with "PNG" option.
  const pngFormatOption = page.getByRole('radio', { name: 'PNG', exact: true });
  
  // If radio buttons aren't used, it might be a select.
  // Let's try radio first as it's common for format selection.
  if (await pngFormatOption.isVisible()) {
    await pngFormatOption.click();
  } else {
    // Fallback to select if radios aren't present
    const formatSelect = page.getByRole('combobox', { name: /format/i });
    await formatSelect.selectOption('PNG');
  }

  // Step 4: The user clicks the export/print button.
  // Look for a button labeled "Export", "Print", or "Download".
  const exportButton = page.getByRole('button', { name: /export|print|download/i, exact: true });
  
  // Wait for download to start before clicking
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    exportButton.click()
  ]);

  // Verify the download
  const suggestedFilename = download.suggestedFilename();
  expect(suggestedFilename).toMatch(/\.png$/i);
});
