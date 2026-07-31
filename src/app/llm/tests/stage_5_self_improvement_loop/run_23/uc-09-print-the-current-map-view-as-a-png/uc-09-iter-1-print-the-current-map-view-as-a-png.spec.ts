// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Precondition: At least one base map and one overlay layer are visible on the map.
  await expect.poll(() => getActiveBaseLayerTitle(page)).toBeTruthy();
  await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

  // Step 1: The user clicks the 'Print Map' button in the toolbar to open the printing panel.
  await page.getByRole('button', { name: 'Print Map' }).click();

  // Step 2: The user enters a title for the printout.
  const printPanel = page.getByRole('dialog', { name: 'Print Map' });
  await expect(printPanel).toBeVisible();
  await printPanel.getByLabel('Title').fill('My Map Print');

  // Step 3: The user selects the PNG file format.
  // The file format is a combobox, not radio buttons.
  await printPanel.getByRole('combobox', { name: 'File format' }).selectOption('PNG');

  // Step 4: The user clicks the export/print button.
  // Capture the download before triggering the action.
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    printPanel.getByRole('button', { name: 'Export map' }).click(),
  ]);

  // Expected results: A PNG file containing the current map view is generated and downloaded.
  expect(download.suggestedFilename()).toMatch(/\.png$/);
});
