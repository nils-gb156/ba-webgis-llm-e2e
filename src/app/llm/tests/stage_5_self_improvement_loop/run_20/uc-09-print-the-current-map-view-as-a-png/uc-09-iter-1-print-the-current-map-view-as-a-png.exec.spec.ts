// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getActiveBaseLayerTitle, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Precondition: ensure at least one base map and one overlay layer are visible
  await expect.poll(() => getActiveBaseLayerTitle(page)).toBeTruthy();
  await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

  // Step 1: Open the printing panel
  await page.getByRole('button', { name: 'Print Map' }).click();

  // Expected: The printing panel is visible
  await expect(page.getByRole('dialog', { name: 'Print Map' })).toBeVisible();

  // Step 2: Enter a title for the printout
  await page.getByRole('textbox', { name: 'Title' }).fill('My Map Export');

  // Step 3: Select the PNG file format
  // The format selector is a Chakra combobox, not a radio group.
  await page.getByRole('combobox', { name: 'File format' }).selectOption('PNG');
  await expect(page.getByRole('option', { name: 'PNG', selected: true })).toBeVisible();

  // Step 4: Click the export/print button
  // Capture the download promise before triggering the action
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Export map' }).click(),
  ]);

  // Expected: A PNG file is generated and downloaded
  expect(download.suggestedFilename()).toMatch(/\.png$/);
});
