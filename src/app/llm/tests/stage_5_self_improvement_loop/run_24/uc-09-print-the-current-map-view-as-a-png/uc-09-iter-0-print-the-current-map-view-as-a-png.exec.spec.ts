// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { isLayerRendered, getActiveBaseLayerTitle } from '../../../../map-model-helpers';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Ensure base map and at least one overlay are rendered before printing
  await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
  await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);

  // Step 4: Prepare for file download before triggering the action
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Print Map' }).click(),
  ]);

  // Step 1: Verify the printing panel is visible
  const printPanel = page.getByRole('dialog', { name: 'Print Map' });
  await expect(printPanel).toBeVisible();

  // Step 2: Enter a title for the printout
  const titleInput = printPanel.getByLabel('Title');
  await titleInput.fill('Test Map Printout');

  // Step 3: Select the PNG file format
  const formatSelect = printPanel.getByLabel('Format');
  await formatSelect.selectOption('png');

  // Step 4: Click the export/print button
  await printPanel.getByRole('button', { name: 'Export' }).click();

  // Expected result: A PNG file containing the current map view is generated and downloaded.
  expect(await download.suggestedFilename()).toBe('printout.png');
});
