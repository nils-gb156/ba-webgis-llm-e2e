// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Precondition: at least one base map and one overlay layer are visible.
  await expect.poll(() => getActiveBaseLayerTitle(page)).toBeTruthy();
  await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

  // Step 1: Click the 'Print Map' button to open the printing panel.
  await page.getByRole('button', { name: 'Print Map' }).click();

  // Wait for the print dialog/panel to appear.
  await expect(page.getByRole('dialog', { name: 'Print Map' })).toBeVisible();

  // Step 2: Enter a title for the printout.
  const titleInput = page.getByRole('textbox', { name: 'Title' });
  await titleInput.fill('Test Printout');

  // Step 3: Select the PNG file format.
  const formatSelect = page.getByRole('combobox', { name: 'File format' });
  await formatSelect.selectOption('PNG');

  // Step 4 (setup): Register the download listener before the trigger.
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    // Step 4: Click the export/print button.
    page.getByRole('button', { name: 'Export map' }).click(),
  ]);

  // Expected result: A PNG file is generated and downloaded.
  const suggestedFilename = download.suggestedFilename();
  expect(suggestedFilename).toMatch(/\.png$/);
});
