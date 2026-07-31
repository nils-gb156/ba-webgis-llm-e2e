// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle, isLayerRendered } from '../../../map-model-helpers';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Precondition check: Ensure at least one base layer and one overlay are visible
  await expect.poll(() => getActiveBaseLayerTitle(page)).toBeTruthy();
  await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);

  // Step 1: Open the printing panel
  const printToggle = page.getByTestId('print-toggle');
  // Ensure the print panel is visible. If the toggle is already active, clicking it would close it.
  const printPanel = page.getByTestId('printing-panel');
  const isPrintPanelVisible = await printPanel.isVisible();
  if (!isPrintPanelVisible) {
    await printToggle.click();
  }
  await expect(printPanel).toBeVisible();

  // Step 2: Enter a title for the printout
  // Assuming there is a text input for the title within the printing panel.
  // Based on typical UI patterns, we look for a label or input inside the panel.
  // If no specific testid exists for the title input, we might need to rely on label.
  // Let's assume the input has a label "Title" or similar.
  // Since the UI map doesn't explicitly list a title input testid, we'll try to find it by role or text.
  // However, looking at the UI map, there is no explicit title input listed.
  // Let's look for any input inside the printing panel.
  const titleInput = page.getByTestId('printing-panel').getByRole('textbox', { name: /title/i });
  await titleInput.fill('Test Printout');

  // Step 3: Select the PNG file format
  // Assuming there is a radio group or select for format.
  // Let's look for a radio button or select option for PNG.
  const pngFormatOption = page.getByTestId('printing-panel').getByRole('radio', { name: /PNG/i });
  if (await pngFormatOption.count() > 0) {
    await pngFormatOption.check();
  } else {
    // Fallback: if it's a select, we might need to select it differently.
    // But radio is more common for format selection in such panels.
    // If no radio found, we might need to look for a select.
    const formatSelect = page.getByTestId('printing-panel').getByRole('combobox', { name: /format/i });
    if (await formatSelect.count() > 0) {
      await formatSelect.selectOption('png');
    }
  }

  // Step 4: Trigger the export/print button
  // Assuming there is a button to export/print.
  const exportButton = page.getByTestId('printing-panel').getByRole('button', { name: /export|print/i });
  
  // Wait for download before clicking
  const downloadPromise = page.waitForEvent('download');
  await exportButton.click();

  // Assert download happened
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/\.png$/);
});
