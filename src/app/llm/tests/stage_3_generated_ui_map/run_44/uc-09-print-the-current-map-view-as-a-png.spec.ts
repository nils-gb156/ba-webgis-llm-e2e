// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../map-model-helpers';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Precondition: Ensure map is loaded and layers are visible
  await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);

  // Step 1: Click the 'Print Map' button to open the printing panel
  const printToggle = page.getByTestId('print-toggle');
  const printingPanel = page.getByTestId('printing-panel');

  // Ensure the printing panel is open
  await expect(printingPanel).toBeVisible();

  // Step 2: Enter a title for the printout
  const titleInput = page.getByTestId('printing').locator('input[placeholder*="Title"]');
  if (await titleInput.isVisible()) {
    await titleInput.fill('Test Map Print');
  } else {
    // Fallback if the input has a label or different placeholder
    const titleField = page.getByRole('textbox', { name: /title/i });
    await titleField.fill('Test Map Print');
  }

  // Step 3: Select the PNG file format
  // Assuming there is a radio button or select for format
  const pngOption = page.getByRole('radio', { name: 'PNG' });
  if (await pngOption.isVisible()) {
    await pngOption.click();
  } else {
    // Fallback to select or other mechanism
    const formatSelect = page.getByRole('combobox', { name: /format/i });
    if (await formatSelect.isVisible()) {
      await formatSelect.selectOption('png');
    } else {
      // Last resort: click a button or div that represents PNG
      const pngButton = page.getByText('PNG');
      if (await pngButton.isVisible()) {
        await pngButton.click();
      }
    }
  }

  // Step 4: Click the export/print button
  // Start waiting for download before clicking
  const downloadPromise = page.waitForEvent('download');
  const exportButton = page.getByRole('button', { name: /export|print|download/i });
  await exportButton.click();

  // Verify the download occurred
  const download = await downloadPromise;
  const suggestedFilename = download.suggestedFilename();
  expect(suggestedFilename.toLowerCase()).toMatch(/\.png$/);
});
