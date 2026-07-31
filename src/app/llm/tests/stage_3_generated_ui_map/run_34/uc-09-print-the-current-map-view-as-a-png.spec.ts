// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready
  await expect(page.getByTestId('map-container')).toBeVisible();

  // Step 1: The user clicks the 'Print Map' button in the toolbar to open the printing panel.
  await page.getByTestId('print-toggle').click();

  // Expected result: The printing panel is visible.
  await expect(page.getByTestId('printing-panel')).toBeVisible();

  // Step 2: The user enters a title for the printout.
  const title = 'Test Printout';
  await page.getByRole('textbox', { name: /title/i }).fill(title);

  // Step 3: The user selects the PNG file format.
  // Assuming the format is selected via radio buttons or a dropdown.
  // Based on typical UI, we look for a radio or select option for PNG.
  // If it's a radio button group, we click the one labeled PNG.
  await page.getByRole('radio', { name: 'PNG' }).check();

  // Step 4: The user clicks the export/print button.
  // We need to trigger the download before clicking the button.
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: /export|print/i }).click();

  // Expected result: A PNG file containing the current map view is generated and downloaded.
  const download = await downloadPromise;
  const suggestedFilename = download.suggestedFilename();
  expect(suggestedFilename).toMatch(/\.png$/);
});
