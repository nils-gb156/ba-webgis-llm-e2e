// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle, isLayerRendered } from "../../../map-model-helpers";

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Precondition: Ensure at least one operational layer is visible
  // The defaults include "Temperature", "UV-Index Stations", "EUCOS Ground Stations"
  // We verify that at least one is rendered to satisfy preconditions
  await expect.poll(() => isLayerRendered(page, "Temperature")).toBe(true);

  // Precondition: Ensure a base map is active
  await expect.poll(() => getActiveBaseLayerTitle(page)).toBeTruthy();

  // Step 1: Open the printing panel
  const printToggle = page.getByTestId('print-toggle');
  // Check current state to avoid toggling if already open (though default is false)
  const printingPanel = page.getByTestId('printing-panel');
  const isPanelVisible = await printingPanel.isVisible();
  
  if (!isPanelVisible) {
    await printToggle.click();
  }
  
  await expect(printingPanel).toBeVisible();

  // Step 2: Enter a title for the printout
  // We need to find the title input inside the printing panel.
  // Based on typical patterns, it might be a text input with a label or test id.
  // Since no specific test id for the title input is provided in the UI map,
  // we look for a text input or label within the printing panel.
  // Assuming a standard label "Title" or similar accessible name.
  const titleInput = page.getByRole('textbox', { name: /title/i }).first();
  if (titleInput) {
    await titleInput.fill('My Map Printout');
  } else {
    // Fallback if accessible name is not precise, look for input inside panel
    const fallbackInput = printingPanel.locator('input[type="text"]').first();
    if (fallbackInput) {
        await fallbackInput.fill('My Map Printout');
    }
  }

  // Step 3: Select the PNG file format
  // Look for a radio group or dropdown for format.
  // Assuming a radio button or select with "PNG" option.
  const formatSelect = page.getByRole('combobox', { name: /format/i }).first();
  if (formatSelect) {
    await formatSelect.selectOption('PNG');
  } else {
    // Fallback to radio buttons
    const pngRadio = page.getByRole('radio', { name: /PNG/i }).first();
    if (pngRadio) {
        await pngRadio.click();
    } else {
        // Last resort: click element containing text "PNG" inside printing panel
        const pngOption = printingPanel.getByText('PNG').first();
        if (pngOption) {
            await pngOption.click();
        }
    }
  }

  // Step 4: Trigger the export/print
  // Look for a button with "Export", "Print", or "Download" inside the printing panel
  const exportButton = printingPanel.getByRole('button', { name: /export|print|download/i }).first();
  
  // Wait for download before clicking
  const downloadPromise = page.waitForEvent('download');
  
  if (exportButton) {
    await exportButton.click();
  } else {
    // Fallback: click any button in the panel if specific export button not found
    const anyButton = printingPanel.getByRole('button').first();
    if (anyButton) {
        await anyButton.click();
    }
  }

  // Assert: PNG file is generated and downloaded
  const download = await downloadPromise;
  const suggestedFilename = download.suggestedFilename();
  
  expect(suggestedFilename).toMatch(/\.png$/i);
});
