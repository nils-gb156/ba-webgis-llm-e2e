// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered, getActiveBaseLayerTitle } from "../../../map-model-helpers";

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Precondition: Ensure map is loaded and layers are visible
  await expect.poll(() => getActiveBaseLayerTitle(page)).toBeTruthy();
  await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);

  // Step 1: Click the 'Print Map' button in the toolbar to open the printing panel
  const printToggle = page.getByTestId('print-toggle');
  // Ensure the panel is visible; toggle might already be active or inactive
  const printingPanel = page.getByTestId('printing-panel');
  const isPanelVisible = await printingPanel.isVisible();
  
  if (!isPanelVisible) {
    await printToggle.click();
  }

  // Verify the printing panel is visible
  await expect(printingPanel).toBeVisible();

  // Step 2: Enter a title for the printout
  // Assuming there is an input field for the title inside the printing panel.
  // Since no specific testid for the title input is listed, we look for a label or role.
  // Common patterns: "Title" or "Print Title". We'll try to find an input inside the panel.
  const titleInput = printingPanel.getByLabel(/title/i);
  if (titleInput) {
    await titleInput.fill('Test Printout');
  } else {
    // Fallback: look for any text input if label is not found
    const anyInput = printingPanel.locator('input[type="text"]');
    await anyInput.first().fill('Test Printout');
  }

  // Step 3: Select the PNG file format
  // Assuming there is a radio group or select for format.
  // We look for a radio button or option with "PNG".
  const pngOption = printingPanel.getByRole('radio', { name: 'PNG', exact: true }).first();
  if (await pngOption.isVisible()) {
    await pngOption.check();
  } else {
    // Fallback: look for a select and choose PNG
    const formatSelect = printingPanel.getByLabel(/format/i);
    if (await formatSelect.isVisible()) {
      await formatSelect.selectOption('PNG');
    } else {
      // Last resort: look for any text saying PNG and click it
      const pngButton = printingPanel.getByText('PNG', { exact: true }).first();
      await pngButton.click();
    }
  }

  // Step 4: Click the export/print button
  // Wait for the download before clicking
  const downloadPromise = page.waitForEvent('download');
  
  const exportButton = printingPanel.getByRole('button', { name: /export|print|generate/i }).first();
  await exportButton.click();

  // Verify the download happened
  const download = await downloadPromise;
  const suggestedFilename = download.suggestedFilename();
  
  // Expected result: A PNG file is generated and downloaded
  expect(suggestedFilename).toMatch(/\.png$/i);
});
