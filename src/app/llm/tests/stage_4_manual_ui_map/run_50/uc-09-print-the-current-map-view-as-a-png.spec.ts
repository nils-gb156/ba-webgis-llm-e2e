// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Step 1: The user clicks the 'Print Map' button in the toolbar to open the printing panel.
  const printToggle = page.getByTestId('print-toggle');
  
  // Check current state of the toggle to ensure we open it
  const isPrintTogglePressed = await printToggle.getAttribute('aria-pressed');
  if (isPrintTogglePressed === 'true') {
    // If already open, close it first to ensure we test the opening flow
    await printToggle.click();
  }
  
  await printToggle.click();

  // Verify printing panel is visible
  await expect(page.getByTestId('printing-panel')).toBeVisible();

  // Step 2: The user enters a title for the printout.
  // We need to find the title input inside the printing panel.
  // Based on common patterns, it might be labeled "Title" or similar.
  // Since no specific test-id is given for the title input in the UI map, 
  // we'll look for a label or role inside the printing panel.
  const printingPanel = page.getByTestId('printing-panel');
  
  // Attempt to find the title input. Usually it's a text input with a label.
  // We'll try to find an input within the panel.
  const titleInput = printingPanel.getByRole('textbox', { name: /title/i });
  await expect(titleInput).toBeVisible();
  await titleInput.fill('Test Printout');

  // Step 3: The user selects the PNG file format.
  // We need to find the format selector/radio button group.
  // Look for a radio group or select with "Format" or "PNG" in the panel.
  const formatRadio = printingPanel.getByRole('radio', { name: 'PNG' });
  
  // Check if PNG is already selected
  const isPngSelected = await formatRadio.isChecked();
  if (!isPngSelected) {
    await formatRadio.click();
  }
  
  // Verify PNG is selected
  await expect(formatRadio).toBeChecked();

  // Step 4: The user clicks the export/print button.
  // Look for an export or print button inside the panel.
  const exportButton = printingPanel.getByRole('button', { name: /export|print/i });
  await expect(exportButton).toBeVisible();

  // Wait for the download to start before clicking
  const downloadPromise = page.waitForEvent('download');
  await exportButton.click();

  // Wait for download to complete
  const download = await downloadPromise;
  
  // Verify the file was downloaded and is a PNG
  const suggestedFilename = download.suggestedFilename();
  expect(suggestedFilename.toLowerCase()).toMatch(/\.png$/);
});
