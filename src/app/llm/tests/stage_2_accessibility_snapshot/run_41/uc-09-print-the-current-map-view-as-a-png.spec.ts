// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  // Navigate to the base URL
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready and layers to be visible
  await page.waitForSelector('[data-testid="map-container"]');
  
  // Ensure at least one base map and one overlay layer are visible.
  // The context shows EUCOS Ground Stations, UV-Index Stations, and Temperature are checked.
  // We assume the app loads with these checked based on the accessibility tree provided.
  // If not, we might need to ensure they are checked, but the preconditions say "At least one ... are visible".
  // The accessibility tree shows them as [checked], so we proceed.

  // Step 1: The user clicks the 'Print Map' button in the toolbar to open the printing panel.
  const printButton = page.getByRole('button', { name: 'Print Map' });
  await printButton.click();

  // Verify the printing panel is visible.
  // The accessibility tree doesn't explicitly name the print dialog/panel, but it appears after clicking the button.
  // We can look for a dialog or a specific panel. Often print dialogs are dialogs.
  // Let's assume the print interface appears. We can check for a title input or similar to confirm visibility.
  // Since we don't have a specific testid for the print panel, we'll look for the title input which is part of the flow.
  // Or we can check if the print button state changes or a dialog appears.
  // Let's try to find the title input field to assert the panel is open.
  // Commonly, print dialogs have a title field.
  await expect(page.getByLabel('Title')).toBeVisible({ timeout: 5000 });

  // Step 2: The user enters a title for the printout.
  const titleInput = page.getByLabel('Title');
  await titleInput.fill('Test Map Printout');

  // Step 3: The user selects the PNG file format.
  // We need to find the format selector. It's likely a radio group or dropdown.
  // Let's look for a label or role associated with PNG.
  const pngFormatOption = page.getByRole('radio', { name: 'PNG' });
  // If it's not a radio, it might be a checkbox or option. Let's try radio first as it's common for mutually exclusive formats.
  // If the above fails, we might need to look for a combobox or checkbox.
  // Given the complexity, let's assume a radio button or a selectable option.
  // If 'PNG' is not found as a radio, let's try checking for a checkbox or a specific test id if available.
  // Since no test id is provided for the format selector, we rely on accessible name.
  // Let's try to find an element with text 'PNG' and click it, or use getByRole('checkbox', { name: 'PNG' }) if it's a checkbox.
  // However, formats are usually mutually exclusive, so Radio is a good guess.
  // If the UI uses a select/dropdown, we would use getByRole('combobox') or getByRole('listbox').
  // Let's try to locate the format selector more robustly.
  // Often, print dialogs have a "Format" label.
  const formatLabel = page.getByText('Format');
  // Let's assume the format selection is near the title.
  // We will try to click the PNG option. If it's a radio, it should be clickable.
  // If it's a checkbox, we use checkbox.
  // Let's try to find any element with 'PNG' in its accessible name or text.
  // A safer bet for "selecting" a format in a dialog might be a radio button.
  await expect(pngFormatOption).toBeVisible({ timeout: 5000 });
  await pngFormatOption.click();

  // Step 4: The user clicks the export/print button.
  // We need to find the export/print button.
  const exportButton = page.getByRole('button', { name: /Print|Export|Save/i });
  // It might be specifically "Print" or "Export as PNG".
  // Let's try to find a button with "Print" or "Export" in the dialog.
  // Since the panel is open, we can scope the search to the dialog if we can identify it.
  // Let's assume the button is "Print" or "Export".
  // We'll try to click the button that triggers the download.
  // Often it's labeled "Print" or "Export".
  
  // Register for the download event before clicking
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    exportButton.click()
  ]);

  // Verify the PNG file containing the current map view is generated and downloaded.
  // We can check the suggested filename.
  const suggestedFilename = download.suggestedFilename();
  expect(suggestedFilename).toMatch(/\.png$/i);

  // Clean up the download
  await download.delete();
});
