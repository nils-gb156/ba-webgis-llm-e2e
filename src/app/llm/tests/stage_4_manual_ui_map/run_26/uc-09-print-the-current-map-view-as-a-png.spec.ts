// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle, isLayerRendered } from '../../../map-model-helpers';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Precondition check: Ensure at least one base map and one overlay are visible
  await expect.poll(() => getActiveBaseLayerTitle(page)).toBeTruthy();
  await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);

  // Step 1: Click the 'Print Map' button to open the printing panel
  const printToggle = page.getByTestId('print-toggle');
  // Ensure the panel is open. The toggle might be pressed or not.
  const printingPanel = page.getByTestId('printing-panel');
  const isPanelVisible = await printingPanel.isVisible();
  if (!isPanelVisible) {
    await printToggle.click();
  }

  // Verify the printing panel is visible
  await expect(printingPanel).toBeVisible();

  // Step 2: Enter a title for the printout
  // We look for an input inside the printing panel for the title
  const titleInput = printingPanel.getByLabel('Title').or(printingPanel.getByTestId('print-title-input'));
  // Fallback if specific test id or label isn't found, try any input inside
  const effectiveTitleInput = titleInput.count() > 0 ? titleInput : printingPanel.locator('input[type="text"]').first();
  await effectiveTitleInput.fill('Map Export Test');

  // Step 3: Select the PNG file format
  // Look for a radio button or select for format
  const formatSelector = printingPanel.getByRole('radiogroup').or(printingPanel.getByRole('combobox'));
  if (formatSelector) {
    if (await formatSelector.isVisible()) {
        await formatSelector.selectOption('png');
    }
} else {
    // Fallback: try to find a PNG option by text
    const pngOption = printingPanel.getByText('PNG', { exact: true });
    if (await pngOption.isVisible()) {
        await pngOption.click();
    }
}

  // Step 4: Click the export/print button
  const exportButton = printingPanel.getByRole('button', { name: /export|print|generate/i });
  // Wait for the download event before clicking
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    exportButton.click()
  ]);

  // Expected result: A PNG file is generated and downloaded
  const suggestedFilename = download.suggestedFilename();
  expect(suggestedFilename.toLowerCase()).toMatch(/\.png$/);
});
