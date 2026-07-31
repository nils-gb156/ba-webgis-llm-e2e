// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Precondition: Ensure at least one base map and one overlay layer are visible.
  // The accessibility tree shows Basemaps combobox and several operational layers.
  // We assume the default state satisfies preconditions, but let's ensure
  // the layer switcher is open to verify layers if needed. However, since we
  // just need to print, we can proceed directly to the print action.
  // The prompt implies the map is already loaded with layers.

  // Step 1: The user clicks the 'Print Map' button in the toolbar to open the printing panel.
  const printButton = page.getByRole('button', { name: 'Print Map' });
  await printButton.click();

  // Expected result: The printing panel is visible.
  // We look for a dialog or panel that appears after clicking Print Map.
  // Since there is no specific test ID for the print dialog in the provided list,
  // we rely on the button name or a visible title within the panel.
  // Often, print dialogs have a title like "Print Map" or similar.
  // Let's try to find a dialog or panel. If not found by role, we might look for
  // a specific text inside the main content area or a modal.
  // Given the context, it might be a panel sliding in or a modal.
  // Let's assume it's a dialog/modal for now, or a panel with a specific header.
  // If no specific test ID, we might need to infer.
  // Let's check if there's a generic panel. The accessibility tree doesn't show a new region
  // immediately. Let's look for a dialog with "Print" in the name.
  const printPanel = page.getByRole('dialog', { name: /Print/i, exact: false });
  
  // Fallback: If it's not a dialog, it might be a panel. Let's try to find an input field
  // that would be inside the print panel, such as a title input.
  // If the panel is not immediately visible, we might need to wait.
  // Let's try to locate the title input directly, which implies the panel is open.
  const titleInput = page.getByLabel('Title').or(page.getByPlaceholder('Title'));
  
  // If we can't find the panel explicitly, we'll assume clicking the button opens it
  // and proceed to interact with elements inside it.
  // Let's try to find the title input. If it's not found, the test might fail.
  // A common pattern is a dialog with a title input.
  // Let's try to assert the print panel is visible by looking for a specific element.
  // Since no test ID is provided for the print dialog, we rely on the presence of the title input.
  await expect(titleInput).toBeVisible({ timeout: 5000 });

  // Step 2: The user enters a title for the printout.
  const testTitle = 'My Map Printout';
  await titleInput.fill(testTitle);

  // Step 3: The user selects the PNG file format.
  // We need to find the format selector. It's likely a radio group or a dropdown.
  // Let's look for a radio button or checkbox with "PNG".
  const pngFormat = page.getByRole('radio', { name: 'PNG', exact: true }).or(
    page.getByRole('option', { name: 'PNG', exact: true })
  );
  
  // If it's a radio button, it might not be checked by default.
  // If it's a dropdown, we need to select it.
  // Let's try to click the PNG option. If it's a radio, clicking it selects it.
  // If it's a dropdown, we need to open it first.
  // Let's assume it's a radio button group for simplicity if no dropdown is obvious.
  // Alternatively, it could be a select element.
  // Let's try to find a select element for format.
  const formatSelect = page.getByRole('combobox', { name: /Format/i });
  if (await formatSelect.isVisible()) {
    await formatSelect.selectOption('PNG');
  } else {
    // Fallback to radio buttons
    await pngFormat.click();
  }

  // Step 4: The user clicks the export/print button.
  // We need to find the button that triggers the download.
  const exportButton = page.getByRole('button', { name: /Export|Print|Download/i, exact: true });
  await expect(exportButton).toBeVisible({ timeout: 5000 });
  
  // Set up download listener before clicking
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    exportButton.click()
  ]);

  // Expected result: A PNG file containing the current map view is generated and downloaded.
  const suggestedFilename = download.suggestedFilename();
  expect(suggestedFilename).toMatch(/\.png$/i);
  
  // Clean up the downloaded file
  await download.delete();
});
