// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Precondition: Ensure map is loaded and layers are visible.
  // The accessibility tree shows EUCOS and UV-Index stations are checked by default.
  await expect(page.getByTestId('map-container')).toBeVisible();

  // Step 1: Click the 'Print Map' button in the toolbar.
  const printToggle = page.getByRole('button', { name: 'Print Map' });
  await printToggle.click();

  // Expected result: The printing panel is visible.
  // We look for a dialog or panel that likely contains title/format inputs.
  // Based on the context, it might be a dialog or part of the info panel.
  // Let's look for common print dialog elements or a specific test id if available.
  // Since no specific test id for the print dialog is listed, we infer from the button name.
  // Often print dialogs have a title or specific inputs.
  // Let's wait for the print toggle to be in a pressed/active state or for a dialog to appear.
  // Given the button is "Print Map", clicking it likely opens a modal/dialog.
  // We'll assert that the UI changes to indicate the print panel is open.
  // A safe bet is to look for a dialog with "Print" in the name or similar.
  // However, without a specific test id, we rely on the fact that the button might change state
  // or a new element appears. Let's assume a dialog appears.
  // If no dialog appears, it might be inline. Let's try to find a title input which is Step 2.
  
  // Step 2: Enter a title for the printout.
  // We need to find the title input. It's likely inside the print panel/dialog.
  // Let's look for an input with label "Title" or placeholder "Title".
  // Since we don't have a specific test id for the print dialog, we'll try to locate the input
  // by its label or placeholder.
  const titleInput = page.getByLabel('Title').or(page.getByPlaceholder('Title'));
  
  // If the above doesn't work, we might need to look for a more generic input if the label is different.
  // Let's try to find any input that appears after clicking print.
  // A common pattern is a dialog with "Print Map" title.
  const printDialog = page.getByRole('dialog', { name: /Print/i }).or(page.getByRole('dialog', { name: /Print Map/i }));
  
  // If no dialog is found, maybe it's an inline panel. Let's check for the presence of a title input anywhere.
  // We will use expect.poll to wait for the UI to update.
  await expect.poll(async () => {
    const title = page.getByLabel('Title');
    const placeholder = page.getByPlaceholder('Title');
    return title.count() > 0 || placeholder.count() > 0;
  }).toBeTruthy();

  // Determine the actual locator for the title input
  const titleLocator = page.getByLabel('Title').first().or(page.getByPlaceholder('Title').first());
  await titleLocator.fill('Test Printout');

  // Step 3: Select the PNG file format.
  // Look for a radio button or select dropdown for format.
  // Common labels: "Format", "PNG", "JPEG".
  const formatSelect = page.getByLabel('Format').or(page.getByRole('combobox', { name: 'Format' }));
  
  // If it's a radio group, look for PNG radio button.
  const pngRadio = page.getByRole('radio', { name: 'PNG' });
  
  // Determine the actual locator for format selection
  let formatLocator;
  if (await formatSelect.count() > 0) {
    formatLocator = formatSelect;
  } else if (await pngRadio.count() > 0) {
    formatLocator = pngRadio;
  } else {
    // Fallback: look for any select or radio related to format
    formatLocator = page.getByRole('combobox', { name: /format/i }).first().or(page.getByRole('radio', { name: /png/i }).first());
  }

  if (formatLocator.locator('select, input[type="radio"]').first().evaluate(el => el.tagName) === 'SELECT') {
    await formatLocator.selectOption('PNG');
  } else if (await pngRadio.count() > 0) {
    await pngRadio.check();
  } else {
    await formatLocator.click();
    // If it's a custom dropdown, we might need to click the option.
    // Assuming standard HTML for now.
    await page.getByRole('option', { name: 'PNG' }).click();
  }

  // Step 4: Click the export/print button.
  // Look for a button labeled "Print", "Export", or "Download".
  const printButton = page.getByRole('button', { name: /Print|Export|Download/i }).first();
  
  // Wait for the button to be clickable and then click it.
  await expect(printButton).toBeEnabled();
  
  // Set up download listener before clicking
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    printButton.click()
  ]);

  // Expected result: A PNG file is downloaded.
  const suggestedFilename = download.suggestedFilename();
  expect(suggestedFilename).toMatch(/\.png$/);
});
