// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered, getActiveBaseLayerTitle } from '../../../../map-model-helpers';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Ensure base map and at least one overlay are rendered before printing
  await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
  await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);

  // Step 1: The user clicks the 'Print Map' button in the toolbar to open the printing panel.
  // The button has data-testid="print-toggle" and role="button" with name "Print Map".
  // It may already be pressed (toggled on) from a previous state, but we need to ensure the panel opens.
  // Clicking the toggle should open the panel if it's closed.
  await page.getByTestId('print-toggle').click();

  // Step 1 (continued): Verify the printing panel is visible.
  // The panel is a dialog with name "Print Map".
  const printPanel = page.getByRole('dialog', { name: 'Print Map' });
  await expect(printPanel).toBeVisible();

  // Step 2: The user enters a title for the printout.
  const titleInput = printPanel.getByLabel('Title');
  await titleInput.fill('Test Map Printout');

  // Step 3: The user selects the PNG file format.
  const formatSelect = printPanel.getByLabel('File format');
  await formatSelect.selectOption('PNG');

  // Step 4: Prepare for file download before triggering the action.
  // The user clicks the export/print button.
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    printPanel.getByRole('button', { name: 'Export map' }).click(),
  ]);

  // Expected result: A PNG file containing the current map view is generated and downloaded.
  // The download should be a PNG file.
  const filename = await download.suggestedFilename();
  expect(filename).toMatch(/\.png$/i);
});
