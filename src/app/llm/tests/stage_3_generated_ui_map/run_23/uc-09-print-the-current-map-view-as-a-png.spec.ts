// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapZoomLevel, getMapCenter, isLayerRendered } from "../../../map-model-helpers";

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Precondition check: Ensure map is ready and layers are visible
  await expect.poll(() => getMapZoomLevel(page)).toBeDefined();
  await expect.poll(() => getMapCenter(page)).toBeDefined();
  await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);

  // Step 1: Click the 'Print Map' button in the toolbar to open the printing panel.
  await page.getByTestId('print-toggle').click();

  // Verify the printing panel is visible
  await expect(page.getByTestId('printing-panel')).toBeVisible();

  // Step 2: Enter a title for the printout.
  // Assuming there is a text input for the title inside the printing panel.
  // Based on common patterns, we look for a label or input related to title.
  // Since no specific testid for title input is listed, we use getByRole with label.
  const titleInput = page.getByRole('textbox', { name: /title/i });
  await titleInput.fill('My Map Printout');

  // Step 3: Select the PNG file format.
  // Assuming there is a radio group or select for format.
  // We look for a radio button or option labeled 'PNG'.
  const pngOption = page.getByRole('radio', { name: 'PNG' }).or(page.getByRole('option', { name: 'PNG' }));
  if (await pngOption.count() > 0) {
    await pngOption.click();
  } else {
    // Fallback: if it's a select, click the select and then the option
    const formatSelect = page.getByRole('combobox', { name: /format/i }).or(page.getByRole('combobox', { name: /type/i }));
    if (await formatSelect.count() > 0) {
      await formatSelect.click();
      await page.getByRole('option', { name: 'PNG' }).click();
    } else {
      // Last resort: look for any button or input that might control format
      const formatControl = page.getByTestId('printing-panel').getByRole('button', { name: 'PNG' }).or(page.getByTestId('printing-panel').getByRole('radio', { name: 'PNG' }));
      if (await formatControl.count() > 0) {
        await formatControl.click();
      }
    }
  }

  // Step 4: Click the export/print button.
  const exportButton = page.getByRole('button', { name: /export|print/i });
  await expect(exportButton).toBeVisible();

  // Wait for the download to start before clicking the button
  const downloadPromise = page.waitForEvent('download');
  await exportButton.click();

  // Assert that a file was downloaded
  const download = await downloadPromise;
  const suggestedFilename = download.suggestedFilename();
  expect(suggestedFilename).toMatch(/\.png$/);
});
