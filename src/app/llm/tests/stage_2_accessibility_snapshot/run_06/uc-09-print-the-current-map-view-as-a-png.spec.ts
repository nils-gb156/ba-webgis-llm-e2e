// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  // Precondition: The app is loaded successfully.
  // Precondition: At least one base map and one overlay layer are visible on the map.
  // (Base map is visible by default, EUCOS and Temperature layers are checked by default)

  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Step 1: The user clicks the 'Print Map' button in the toolbar to open the printing panel.
  const printToggle = page.getByRole('button', { name: 'Print Map' });
  await printToggle.click();

  // Expected result: The printing panel is visible.
  // We look for the panel that appeared. Since there's no specific test id for the print dialog,
  // we look for a dialog or panel containing print-related controls.
  // The accessibility tree shows "Print Map" button. After clicking, a panel/dialog usually appears.
  // We'll wait for a text or element that indicates the print panel is open.
  // Common indicators: "Title" input, "Format" select, or "Export" button.
  // Let's assume the print panel contains a title input and format selector.
  // We can assert visibility of the map-toolbar or a specific dialog.
  // Given the context, let's look for the print panel content.
  // Often, these panels are dialogs or side panels. Let's try to find a dialog with "Print" or similar.
  // Or we can just wait for the title input to be visible as a proxy for the panel being open.
  
  // Let's look for a dialog or a panel. The prompt doesn't give a specific test id for the print panel.
  // However, we have `map-controls-panel` or `map-toolbar`.
  // Let's assume the print panel is a dialog or a section that becomes visible.
  // We will assert that a title input becomes visible, which implies the panel is open.
  await expect(page.getByLabel('Title')).toBeVisible();

  // Step 2: The user enters a title for the printout.
  await page.getByLabel('Title').fill('Test Map Print');

  // Step 3: The user selects the PNG file format.
  // We need to find the format selector. It's likely a combobox or radio buttons.
  // Let's assume it's a combobox labeled "Format" or similar.
  await page.getByRole('combobox', { name: 'Format' }).selectOption('png');

  // Step 4: The user clicks the export/print button.
  // We need to find the export button.
  const exportButton = page.getByRole('button', { name: /Export|Print|Generate/i });
  await expect(exportButton).toBeVisible();
  
  // Prepare for download
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    exportButton.click()
  ]);

  // Expected result: A PNG file containing the current map view is generated and downloaded.
  // We can't easily assert the content of the PNG in a simple E2E test without complex image comparison,
  // but we can assert that a download happened and has a PNG extension.
  const suggestedFilename = download.suggestedFilename();
  expect(suggestedFilename).toMatch(/\.png$/);
});
