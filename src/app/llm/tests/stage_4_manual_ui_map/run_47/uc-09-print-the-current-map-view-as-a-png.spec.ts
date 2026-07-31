// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Step 1: Open the printing panel
  const printToggle = page.getByTestId('print-toggle');
  
  // Check current state to avoid toggling if already open
  const printingPanel = page.getByTestId('printing-panel');
  const isPanelVisible = await printingPanel.isVisible();

  if (!isPanelVisible) {
    await printToggle.click();
  }

  // Verify printing panel is visible
  await expect(printingPanel).toBeVisible();

  // Step 2: Enter a title for the printout
  // Assuming there is an input field for the title within the printing panel
  // Based on common patterns, we look for a text input or label "Title" inside the panel
  const titleInput = printingPanel.getByLabel(/Title/i).or(printingPanel.getByRole('textbox', { name: /title/i }));
  // Fallback if no accessible name is found, try to find an input inside the panel
  const targetTitleInput = titleInput.count() > 0 ? titleInput : printingPanel.locator('input[type="text"]');
  await targetTitleInput.fill('My Map Printout');

  // Step 3: Select PNG file format
  // Assuming there is a radio group or dropdown for format selection
  // We look for "PNG" option within the printing panel
  const pngOption = printingPanel.getByRole('radio', { name: 'PNG' }).or(printingPanel.getByText('PNG'));
  
  // If radio buttons are used, ensure PNG is selected
  if (pngOption.count() > 0) {
    // Check if PNG is already checked
    const isPngChecked = await pngOption.isChecked();
    if (!isPngChecked) {
      await pngOption.click();
    }
  } else {
    // Fallback: assume a dropdown or other selector if radios aren't present
    // This part is speculative based on limited UI map, but we try to find a format selector
    const formatSelector = printingPanel.getByRole('combobox').or(printingPanel.getByRole('button', { name: /format/i }));
    if (formatSelector.count() > 0) {
      await formatSelector.click();
      // Select PNG from list
      await page.getByText('PNG').click();
    }
  }

  // Step 4: Trigger export/print
  // Look for an export or print button within the printing panel
  const exportButton = printingPanel.getByRole('button', { name: /export|print/i }).or(printingPanel.getByTestId('print-export-button'));
  
  // Wait for download to start before clicking
  const downloadPromise = page.waitForEvent('download');
  await exportButton.click();

  // Verify download
  const download = await downloadPromise;
  const suggestedFilename = download.suggestedFilename();
  expect(suggestedFilename).toMatch(/\.png$/);
});
