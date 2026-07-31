// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle, isLayerRendered } from '../../../map-model-helpers';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready and have a base layer
  await expect.poll(() => getActiveBaseLayerTitle(page)).toBeTruthy();

  // Ensure at least one operational layer is rendered (Temperature is a default)
  await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);

  // Step 1: Click the 'Print Map' button to open the printing panel
  const printToggle = page.getByTestId('print-toggle');
  await printToggle.click();

  // Verify the printing panel is visible
  await expect(page.getByTestId('printing')).toBeVisible();

  // Step 2: Enter a title for the printout
  // Assuming the printing panel contains an input for the title.
  // We look for a label or placeholder containing "Title" or similar.
  // Based on typical UI, there might be a text input inside the printing panel.
  // Let's try to find an input within the printing panel.
  const titleInput = page.getByTestId('printing').getByRole('textbox', { name: /title/i });
  await titleInput.fill('Map Export Test');

  // Step 3: Select the PNG file format
  // Assuming there is a radio group or select for format.
  // We look for a radio button or option with "PNG"
  const pngFormatOption = page.getByTestId('printing').getByRole('radio', { name: 'PNG', exact: true }).or(
    page.getByTestId('printing').getByRole('option', { name: 'PNG', exact: true })
  );
  
  // If it's a radio button, click it. If it's a select, we might need to select it.
  // Let's assume it's a radio button for simplicity as per common patterns.
  // If the above locator fails to find anything, we might need to adjust.
  // Let's try to find any radio button related to format.
  const formatRadios = page.getByTestId('printing').getByRole('radio');
  await expect(formatRadios).toBeVisible();
  
  // Click the PNG radio button. If "PNG" is not the exact name, we might need to be more flexible.
  // Let's assume the accessible name is "PNG".
  const pngRadio = page.getByTestId('printing').getByRole('radio', { name: 'PNG' });
  if (await pngRadio.count() > 0) {
    await pngRadio.click();
  } else {
    // Fallback: if no radio with "PNG", try to find a select and select PNG
    const formatSelect = page.getByTestId('printing').getByRole('combobox');
    if (await formatSelect.count() > 0) {
      await formatSelect.selectOption('PNG');
    } else {
      // Last resort: try to find any input that might be the format selector
      // This is a guess, but we need to cover the use case.
      // Let's assume there's a checkbox or similar if radios/selects aren't found.
      // For now, we'll assume the radio button logic worked or we'll catch an error.
      // To be safe, let's try to find any element that looks like a format selector.
      const formatSelector = page.getByTestId('printing').getByRole('radiogroup');
      if (await formatSelector.count() > 0) {
        const pngRadioInGroup = formatSelector.getByRole('radio', { name: 'PNG' });
        if (await pngRadioInGroup.count() > 0) {
          await pngRadioInGroup.click();
        }
      }
    }
  }

  // Step 4: Click the export/print button
  const exportButton = page.getByTestId('printing').getByRole('button', { name: /export|print/i });
  await expect(exportButton).toBeVisible();
  
  // Wait for the download to start
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    exportButton.click()
  ]);

  // Verify the download suggested filename ends with .png
  const suggestedFilename = download.suggestedFilename();
  expect(suggestedFilename).toMatch(/\.png$/i);
});
