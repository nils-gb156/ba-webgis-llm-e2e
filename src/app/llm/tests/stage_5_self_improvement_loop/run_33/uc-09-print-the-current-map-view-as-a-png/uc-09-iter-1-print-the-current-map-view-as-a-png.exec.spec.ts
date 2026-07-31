// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getActiveBaseLayerTitle, isLayerRendered } from '../../../../map-model-helpers';

test('9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map and layers to be ready
  await expect(page.getByTestId('map-container')).toBeVisible();
  await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
  await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

  // Step 1: Click the Print Map button to open the printing panel
  // The toolbar toggle button has aria-pressed="true" after being clicked.
  // We need to click it once to open the dialog.
  await page.getByRole('button', { name: 'Print Map' }).click();

  // Verify the printing panel is visible
  await expect(page.getByRole('dialog', { name: 'Print Map' })).toBeVisible();

  // Step 2: Enter a title for the printout
  const titleInput = page.getByRole('textbox', { name: 'Title' });
  await titleInput.fill('Test Printout');
  await expect(titleInput).toHaveValue('Test Printout');

  // Step 3: Select the PNG file format
  const formatCombobox = page.getByRole('combobox', { name: 'File format' });
  await formatCombobox.selectOption('png');
  await expect(formatCombobox).toHaveValue('png');

  // Step 4: Click the export/print button
  // Wait for download before clicking
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export map' }).click();

  const download = await downloadPromise;
  const suggestedFilename = download.suggestedFilename();

  // Verify a PNG file was generated and downloaded
  expect(suggestedFilename).toMatch(/\.png$/);
});
