// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../map-model-helpers';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for initial map state to settle
  await expect(page.getByTestId('map-container')).toBeVisible();
  await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);

  // Step 1: The user clicks the 'Print Map' button in the toolbar to open the printing panel.
  const printToggle = page.getByTestId('print-toggle');
  await printToggle.click();

  // Verify printing panel is visible
  await expect(page.getByTestId('printing-panel')).toBeVisible();

  // Step 2: The user enters a title for the printout.
  const titleInput = page.getByLabel('Title');
  await titleInput.fill('Test Printout');

  // Step 3: The user selects the PNG file format.
  const pngFormatOption = page.getByRole('radio', { name: 'PNG' });
  await pngFormatOption.click();

  // Step 4: The user clicks the export/print button.
  // Register download listener before triggering the action
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: /print|export|generate/i }).click()
  ]);

  // Verify the download happened and has a PNG extension
  const suggestedFilename = download.suggestedFilename();
  expect(suggestedFilename).toMatch(/\.png$/i);

  // Clean up the downloaded file
  await download.delete();
});
