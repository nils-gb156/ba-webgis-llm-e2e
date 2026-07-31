// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle } from '../../../../map-model-helpers';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Precondition: at least one base map and one overlay layer are visible
  await expect.poll(() => getActiveBaseLayerTitle(page)).toBeTruthy();
  await expect(page.getByRole('checkbox', { name: 'EUCOS Ground Stations' })).toBeChecked();

  // Step 1: Open the printing panel
  await page.getByTestId('print-toggle').click();
  await expect(page.getByRole('dialog', { name: 'Print Map' })).toBeVisible();

  // Step 2: Enter a title for the printout
  await page.getByLabel('Title').fill('My Map Printout');

  // Step 3: Select the PNG file format
  // The file format is a combobox, not radio buttons.
  await page.getByRole('combobox', { name: 'File format' }).selectOption('PNG');

  // Step 4: Trigger the export/print
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Export map' }).click(),
  ]);

  // Expected result: a PNG file is downloaded
  expect(download.suggestedFilename()).toMatch(/\.png$/);
});
