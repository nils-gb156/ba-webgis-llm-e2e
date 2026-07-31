// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '../../../failure-snapshot-fixture';
import { getActiveBaseLayerTitle, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Precondition: At least one base map and one overlay layer are visible.
  await expect.poll(() => getActiveBaseLayerTitle(page)).toBeTruthy();
  await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

  // Step 1: The user clicks the 'Print Map' button in the toolbar to open the printing panel.
  const printButton = page.getByRole('button', { name: 'Print Map' });
  await printButton.click();

  // Expected result: The printing panel is visible.
  await expect(page.getByRole('dialog', { name: 'Print Map' })).toBeVisible();

  // Step 2: The user enters a title for the printout.
  const titleInput = page.getByRole('textbox', { name: 'Title' });
  await titleInput.fill('Test Printout');

  // Step 3: The user selects the PNG file format.
  // The file format is a combobox, not a radio group.
  const formatCombobox = page.getByRole('combobox', { name: 'File format' });
  await formatCombobox.selectOption('PNG');

  // Verify the selection settled.
  await expect(formatCombobox).toHaveValue('PNG');

  // Step 4: The user clicks the export/print button.
  // Register download listener before triggering the action.
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Export map' }).click(),
  ]);

  // Expected result: A PNG file containing the current map view is generated and downloaded.
  expect(download.suggestedFilename()).toMatch(/\.png$/);

  // Verify the file content is a valid PNG by checking the magic bytes.
  const buffer = await download.buffer();
  expect(buffer.slice(0, 8)).toEqual(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
});
