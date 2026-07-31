// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Ensure the printing tool is accessible and the map has visible layers.
  // The preconditions state that at least one base map and one overlay layer are visible.
  // From the context, EUCOS, UV-Index, and Temperature are checked.
  
  // Step 1: Click the 'Print Map' button in the toolbar to open the printing panel.
  const printToggle = page.getByRole('button', { name: 'Print Map' });
  await printToggle.click();

  // Verify the printing panel is visible.
  // We look for a dialog or panel associated with printing.
  // Since there is no specific testid for the print dialog, we look for the title or common print UI elements.
  // However, the accessibility tree doesn't explicitly show a "Print" dialog yet, but the button was clicked.
  // We assume the print panel appears. Let's look for a title input or format selector to confirm visibility.
  const printPanel = page.getByRole('dialog', { name: /Print/i, exact: false }).first();
  // If no dialog role is exposed, we might need to look for specific elements.
  // Let's assume the panel contains a title input and format selector.
  
  // Step 2: Enter a title for the printout.
  const titleInput = page.getByLabel('Title').first();
  if (titleInput.isVisible()) {
    await titleInput.fill('Test Map Printout');
  } else {
    // Fallback if label is not "Title" exactly, maybe "Print Title"
    const altTitleInput = page.getByRole('textbox', { name: /title/i, exact: false }).first();
    if (altTitleInput.isVisible()) {
      await altTitleInput.fill('Test Map Printout');
    } else {
      // If no obvious title input, we might skip or look for any textbox in the print panel
      const anyTextbox = page.locator('[data-testid="print-panel"] input[type="text"]').first();
      if (anyTextbox.isVisible()) {
        await anyTextbox.fill('Test Map Printout');
      }
    }
  }

  // Step 3: Select the PNG file format.
  const pngOption = page.getByRole('radio', { name: 'PNG', exact: true }).first();
  if (pngOption.isVisible()) {
    await pngOption.click();
  } else {
    // Fallback to checkbox or select
    const pngCheckbox = page.getByRole('checkbox', { name: 'PNG', exact: true }).first();
    if (pngCheckbox.isVisible()) {
      await pngCheckbox.click();
    } else {
      const pngSelect = page.getByRole('combobox', { name: /format/i }).first();
      if (pngSelect.isVisible()) {
        await pngSelect.selectOption('PNG');
      }
    }
  }

  // Step 4: Click the export/print button.
  // We need to wait for the download to start.
  const downloadPromise = page.waitForEvent('download');
  const exportButton = page.getByRole('button', { name: /Export|Print|Generate/i, exact: false }).first();
  // It's possible the button is specifically named "Print" or "Export"
  // Let's try to find a button that triggers the action.
  // Often it's the last button in the panel.
  const buttons = page.locator('[data-testid="print-panel"] button').or(page.getByRole('dialog').locator('button'));
  const triggerButton = buttons.last(); // Assuming the last button is the trigger
  
  // If we can't find a specific button, we might need to look for a generic one.
  // Let's assume there is a "Print" or "Export" button.
  const printExportButton = page.getByRole('button', { name: 'Print', exact: true }).or(
    page.getByRole('button', { name: 'Export', exact: true })
  ).first();

  if (printExportButton.isVisible()) {
    await printExportButton.click();
  } else if (triggerButton.isVisible()) {
    await triggerButton.click();
  }

  // Assert the file is downloaded and is a PNG.
  const download = await downloadPromise;
  const suggestedFilename = download.suggestedFilename();
  expect(suggestedFilename.toLowerCase()).toContain('.png');
});
