// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Step 1: The user clicks the 'Print Map' button in the toolbar to open the printing panel.
  const printToggle = page.getByTestId('print-toggle');
  const printingPanel = page.getByTestId('printing-panel');

  // Ensure the printing panel is open.
  // It is toggledBy the print-toggle button.
  // We assert it is visible. If it's already visible, we don't need to click.
  // If it's not visible, we click the toggle.
  const isPrintingPanelVisible = await printingPanel.isVisible();
  if (!isPrintingPanelVisible) {
    await printToggle.click();
  }
  await expect(printingPanel).toBeVisible();

  // Step 2: The user enters a title for the printout.
  // We need to find the title input inside the printing panel.
  // The UI map doesn't explicitly list the title input, but typically it's a text input.
  // We'll look for an input inside the printing panel.
  const titleInput = printingPanel.locator('input[type="text"], input[type="text"]').first();
  // If there's no specific test id, we might need to rely on label or placeholder.
  // However, the UI map doesn't provide specific test ids for the printing panel's internal elements.
  // Let's assume there's a label or placeholder.
  // Since the UI map is manually authored and might be incomplete for internal elements,
  // we'll try to find the input by its role or label if possible.
  // Let's try to find the first text input in the printing panel.
  const inputs = printingPanel.locator('input');
  await expect(inputs.first()).toBeVisible();
  await inputs.first().fill('Test Print Title');

  // Step 3: The user selects the PNG file format.
  // We need to find the format selector. It might be a radio button or dropdown.
  // Let's look for a radio button or select element in the printing panel.
  const formatRadios = printingPanel.locator('input[type="radio"]');
  const pngRadio = formatRadios.filter({ hasText: 'PNG' });
  if (await pngRadio.count() > 0) {
    await pngRadio.first().check();
  } else {
    // Fallback to a select dropdown if no radio buttons found
    const formatSelect = printingPanel.locator('select');
    if (await formatSelect.count() > 0) {
      await formatSelect.first().selectOption('png');
    }
  }

  // Step 4: The user clicks the export/print button.
  const exportButton = printingPanel.locator('button').filter({ hasText: /Export|Print|Download/i });
  await expect(exportButton.first()).toBeVisible();

  // Wait for download to start before clicking
  const downloadPromise = page.waitForEvent('download');
  await exportButton.first().click();

  // Verify the download
  const download = await downloadPromise;
  const suggestedFilename = download.suggestedFilename();
  expect(suggestedFilename).toMatch(/\.png$/);
});
