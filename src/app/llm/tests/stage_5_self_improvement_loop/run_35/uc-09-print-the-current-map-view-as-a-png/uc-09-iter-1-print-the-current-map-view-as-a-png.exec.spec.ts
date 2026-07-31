// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '../../../failure-snapshot-fixture';
import { getMapZoomLevel, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map and layers to be ready
  await expect.poll(() => getMapZoomLevel(page)).toBeDefined();
  await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

  // Step 1: Click the 'Print Map' button to open the printing panel
  const printToggle = page.getByTestId('print-toggle');
  await printToggle.click();

  // Verify the printing panel is visible
  const printPanel = page.getByTestId('printing-panel');
  await expect(printPanel).toBeVisible();

  // Step 2: Enter a title for the printout
  const titleInput = page.getByRole('textbox', { name: 'Title' });
  await titleInput.fill('My Map Printout');

  // Step 3: Select the PNG file format
  const formatCombobox = page.getByRole('combobox', { name: 'File format' });
  await formatCombobox.selectOption('PNG');

  // Step 4: Click the export/print button
  // Use the exact accessible name to avoid strict mode violation with the toolbar button
  const exportButton = page.getByRole('button', { name: 'Export map' });

  // Wait for the download to start before clicking
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    exportButton.click(),
  ]);

  // Verify the download was triggered and has a PNG extension
  expect(download.suggestedFilename().toLowerCase()).toMatch(/\.png$/);
});
