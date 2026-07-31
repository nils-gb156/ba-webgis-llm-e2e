// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Precondition: Ensure at least one base map and one overlay layer are visible.
  // The accessibility tree shows EUCOS Ground Stations, UV-Index Stations, and Temperature are checked.
  // We just need to ensure the layer switcher is open to verify or toggle if necessary,
  // but the prompt implies these are the initial states. We will assume they are visible.

  // Step 1: The user clicks the 'Print Map' button in the toolbar to open the printing panel.
  const printToggle = page.getByRole('button', { name: 'Print Map' });
  await printToggle.click();

  // Expected result: The printing panel is visible.
  // We look for a dialog or panel that likely contains the print options.
  // Since there isn't a specific test id for the print dialog, we look for common print UI elements.
  // Often, a print dialog might have a title or specific inputs.
  // Let's wait for the print dialog to appear. We can look for a "Title" input or "Format" selector.
  const printDialog = page.getByRole('dialog', { name: /Print|Print Map/i, exact: false });
  
  // If a dialog role isn't used, we might need to look for a panel.
  // Let's try to find an element that indicates the print panel is open.
  // Common indicators: a form with title input, format selection, and an export button.
  // We will assume the print panel is part of the main view or a dialog.
  // Let's try to interact with the print panel by finding the title input.
  const titleInput = page.getByLabel('Title').or(page.getByPlaceholder('Title'));
  
  // If getByRole('dialog') fails to find it, we might need to check for a specific panel.
  // However, let's assume standard ARIA practices or a visible panel.
  // Let's try to find the title input first as a proxy for the panel being open.
  await expect(titleInput).toBeVisible({ timeout: 5000 });

  // Step 2: The user enters a title for the printout.
  await titleInput.fill('My Map Printout');

  // Step 3: The user selects the PNG file format.
  // We look for a format selector, likely a combobox or radio buttons.
  const formatSelector = page.getByLabel('Format').or(page.getByRole('combobox', { name: /Format/i }));
  
  // If it's a combobox, we select PNG.
  if (await formatSelector.isVisible()) {
    await formatSelector.selectOption('png');
  } else {
    // Fallback: Look for radio buttons or buttons labeled PNG
    const pngOption = page.getByRole('radio', { name: 'PNG' }).or(page.getByRole('button', { name: 'PNG' }));
    await expect(pngOption).toBeVisible();
    if (await pngOption.getAttribute('aria-checked') !== 'true') {
      await pngOption.click();
    }
  }

  // Step 4: The user clicks the export/print button.
  const exportButton = page.getByRole('button', { name: /Export|Print|Generate/i });
  await expect(exportButton).toBeVisible();
  
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
