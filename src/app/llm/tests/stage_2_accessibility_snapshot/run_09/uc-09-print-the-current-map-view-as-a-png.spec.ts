// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map and initial layers to be ready
  await expect(page.getByTestId('map-container')).toBeVisible();
  await expect(page.getByRole('checkbox', { name: 'EUCOS Ground Stations' })).toBeChecked();
  await expect(page.getByRole('checkbox', { name: 'Temperature' })).toBeChecked();

  // Step 1: The user clicks the 'Print Map' button in the toolbar to open the printing panel.
  // The button has text "Print Map" and is in the map toolbar.
  const printButton = page.getByRole('button', { name: 'Print Map' });
  await printButton.click();

  // Verify the printing panel is visible.
  // We look for a dialog or panel that contains print-related controls.
  // Since there's no specific testid for the print dialog, we look for the title or common print elements.
  // Based on typical patterns, it might be a dialog or an overlay.
  // Let's assume it appears as a dialog or a distinct panel. We'll wait for a text that is likely in the print panel.
  // Common elements: "Title", "Format", "Export", "Print".
  // We'll wait for the "Print Map" button to potentially change state or for a new element to appear.
  // A safe bet is to wait for a dialog with "Print" in the name or a specific testid if we had it.
  // Without a specific testid, we look for the presence of a form element typical for printing.
  // Let's try to find a dialog or panel containing "Title" or "Format".
  await expect(page.getByRole('dialog', { name: /Print/i })).toBeVisible();

  // Step 2: The user enters a title for the printout.
  // We need to find the title input within the print dialog.
  // It's likely a textbox with label "Title" or placeholder "Title".
  const titleInput = page.getByRole('dialog', { name: /Print/i }).getByLabel('Title');
  await titleInput.fill('My Map Printout');

  // Step 3: The user selects the PNG file format.
  // We need to find the format selector (likely a combobox or radio buttons) and select PNG.
  const formatSelect = page.getByRole('dialog', { name: /Print/i }).getByRole('combobox', { name: /Format/i });
  await formatSelect.selectOption('png');

  // Step 4: The user clicks the export/print button.
  const exportButton = page.getByRole('dialog', { name: /Print/i }).getByRole('button', { name: /Export|Print/i });
  
  // Wait for the download to start before clicking, to catch the file event.
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    exportButton.click()
  ]);

  // Verify the downloaded file name suggests a PNG.
  const suggestedFilename = download.suggestedFilename();
  expect(suggestedFilename).toMatch(/\.png$/);

  // Clean up the downloaded file
  await download.delete();
});
