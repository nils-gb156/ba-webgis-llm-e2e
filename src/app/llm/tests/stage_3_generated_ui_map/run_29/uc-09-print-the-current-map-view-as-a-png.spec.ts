// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered, getActiveBaseLayerTitle } from '../../../map-model-helpers';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Precondition: Ensure map is loaded and has visible layers
  await expect.poll(() => getActiveBaseLayerTitle(page)).toBeTruthy();
  await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);

  // Step 1: The user clicks the 'Print Map' button in the toolbar to open the printing panel.
  await page.getByTestId('print-toggle').click({ force: true });

  // Expected result: The printing panel is visible.
  await expect(page.getByTestId('printing-panel')).toBeVisible();

  // Step 2: The user enters a title for the printout.
  const printTitle = 'E2E Test Map Print';
  // Assuming there is an input field for the title within the printing panel.
  // Based on typical UI, it might be a text input. We'll look for a text input inside the panel.
  const titleInput = page.getByTestId('printing-panel').getByRole('textbox', { name: /title/i });
  await titleInput.fill(printTitle);

  // Step 3: The user selects the PNG file format.
  // Assuming there is a radio group or select for format. We'll look for a radio button or option labeled PNG.
  const pngFormatOption = page.getByTestId('printing-panel').getByRole('radio', { name: 'PNG' });
  if (await pngFormatOption.isVisible()) {
    await pngFormatOption.click({ force: true });
  } else {
    // Fallback to select if radios are not present
    const formatSelect = page.getByTestId('printing-panel').getByRole('combobox', { name: /format/i });
    if (await formatSelect.isVisible()) {
      await formatSelect.selectOption('png');
    } else {
      // Last resort: try to find by text if roles are ambiguous
      await page.getByTestId('printing-panel').getByText('PNG').click();
    }
  }

  // Step 4: The user clicks the export/print button.
  // We need to capture the download before clicking.
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByTestId('printing-panel').getByRole('button', { name: /export|print|generate/i }).click()
  ]);

  // Expected result: A PNG file containing the current map view is generated and downloaded.
  const suggestedFilename = download.suggestedFilename();
  expect(suggestedFilename).toMatch(/\.png$/);

  // Clean up the downloaded file
  await download.delete();
});
