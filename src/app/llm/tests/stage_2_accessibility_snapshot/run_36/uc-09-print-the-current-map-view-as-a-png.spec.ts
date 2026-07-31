// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Precondition: Ensure base map and overlays are visible (they are by default per context)
  // Wait for map to be ready
  const mapContainer = page.getByTestId('map-container');
  await expect(mapContainer).toBeVisible();

  // Step 1: Click the 'Print Map' button to open the printing panel
  const printToggle = page.getByRole('button', { name: 'Print Map' });
  await printToggle.click();

  // Verify the printing panel is visible.
  // The printing panel is likely a dialog or a panel. Based on typical patterns,
  // it might be a dialog or part of the map-controls-panel.
  // Let's look for a dialog or a panel with print-related content.
  // Since there is no specific test id for the print panel, we look for accessible names.
  // We expect a dialog or a region with a title like "Print Map" or similar.
  // Let's try to find a dialog first.
  const printDialog = page.getByRole('dialog', { name: /print/i, exact: false });
  
  // If no dialog is found, it might be a panel. Let's check for common panel locators.
  // However, the prompt mentions "printing panel". Let's assume it opens a dialog or a visible section.
  // We will wait for some element that indicates the print panel is open.
  // Often, print dialogs have a title. Let's try to find a heading or text "Print".
  const printPanelContent = page.getByText('Print', { exact: false }).first();
  
  // A more robust way: wait for the print dialog to appear.
  // If the app uses a standard dialog, getByRole('dialog') works.
  // Let's try to assert on the dialog existence. If it fails, we might need to look for a panel.
  // Given the complexity, let's assume it opens a dialog.
  await expect(printDialog).toBeVisible({ timeout: 5000 }).catch(async () => {
    // Fallback: if it's not a dialog, maybe it's a panel inside map-controls-panel
    const panel = page.getByTestId('map-controls-panel');
    await expect(panel).toBeVisible();
    // Check for print-related inputs inside the panel
    const printTitleInput = page.getByLabel('Title').first();
    await expect(printTitleInput).toBeVisible({ timeout: 5000 });
  });

  // Step 2: Enter a title for the printout
  // We need to find the title input. It's likely a textbox with label "Title".
  const titleInput = page.getByLabel('Title').first();
  
  // If the previous check failed to find the input directly, we might need to scope it.
  // Let's try to find it within the dialog or panel if it exists.
  if (await printDialog.isVisible({ timeout: 1000 }).catch(() => false)) {
    const scopedTitleInput = printDialog.getByLabel('Title').first();
    await scopedTitleInput.fill('My Map Printout');
  } else {
    // Fallback to global search if scoped fails, but be careful with ambiguity
    await titleInput.fill('My Map Printout');
  }

  // Step 3: Select the PNG file format
  // Look for a radio button or select box for format.
  // Commonly, it's a radio group or a select.
  const pngOption = page.getByRole('radio', { name: 'PNG', exact: true }).first();
  if (await pngOption.isVisible({ timeout: 1000 }).catch(() => false)) {
    await pngOption.click();
  } else {
    // Fallback: maybe it's a select
    const formatSelect = page.getByLabel('Format').first();
    if (await formatSelect.isVisible({ timeout: 1000 }).catch(() => false)) {
      await formatSelect.selectOption('PNG');
    } else {
      // Last resort: look for text "PNG" and click a radio or option near it
      const pngText = page.getByText('PNG', { exact: true }).first();
      // Try to click the parent radio or select option
      // This is risky, so we'll try a broader search for a radio button with "PNG" in its accessible name
      const pngRadio = page.getByRole('radio', { name: /PNG/ }).first();
      await pngRadio.click();
    }
  }

  // Step 4: Click the export/print button
  // Look for a button labeled "Print", "Export", or "Download"
  const exportButton = page.getByRole('button', { name: /print|export/i, exact: false }).first();
  
  // Wait for download event before clicking
  const downloadPromise = page.waitForEvent('download');
  
  // We need to ensure the button is within the print panel/dialog
  let buttonToClick = exportButton;
  if (await printDialog.isVisible({ timeout: 1000 }).catch(() => false)) {
    buttonToClick = printDialog.getByRole('button', { name: /print|export/i, exact: false }).first();
  }
  
  await buttonToClick.click();

  // Verify the file was downloaded
  const download = await downloadPromise;
  const suggestedFilename = download.suggestedFilename();
  expect(suggestedFilename).toMatch(/\.png$/i);
});
