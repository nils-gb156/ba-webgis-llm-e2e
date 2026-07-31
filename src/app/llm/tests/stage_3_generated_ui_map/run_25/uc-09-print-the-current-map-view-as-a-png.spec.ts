// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle, isLayerRendered } from '../../../map-model-helpers';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Precondition: Verify at least one base map and one overlay layer are visible
  await expect.poll(() => getActiveBaseLayerTitle(page)).toBeTruthy();
  await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);

  // Step 1: Click the 'Print Map' button to open the printing panel
  await page.getByRole('button', { name: 'Print' }).click();

  // Expected result: The printing panel is visible
  await expect(page.getByTestId('printing-panel')).toBeVisible();

  // Step 2: Enter a title for the printout
  await page.getByLabel('Title').fill('Test Printout');

  // Step 3: Select the PNG file format
  // Assuming the format selector is a radio group or select.
  // Based on typical UI, we look for a radio button or option labeled "PNG".
  // If it's a select, we use selectOption. If it's a radio, we click.
  // Let's assume a radio button or similar interactive element for format selection.
  // If the UI uses a select element:
  // await page.getByLabel('Format').selectOption('png');
  // If the UI uses radio buttons:
  await page.getByRole('radio', { name: 'PNG' }).click();

  // Step 4: Click the export/print button
  // Capture the download event before triggering the action
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Export' }).click()
  ]);

  // Expected result: A PNG file is generated and downloaded
  expect(download.suggestedFilename()).toMatch(/\.png$/);
});
