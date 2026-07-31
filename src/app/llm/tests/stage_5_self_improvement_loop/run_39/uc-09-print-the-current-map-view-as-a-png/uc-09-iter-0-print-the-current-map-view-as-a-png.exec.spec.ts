// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getMapZoomLevel } from '../../../../map-model-helpers';

test('9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Ensure map is loaded and zoomed in enough to have meaningful content
  await expect.poll(() => getMapZoomLevel(page)).toBeGreaterThan(0);

  // Step 1: Open the printing panel
  const printToggle = page.getByTestId('print-toggle');
  await printToggle.click();

  // Verify the printing panel is visible
  await expect(page.getByRole('dialog', { name: /Print/ })).toBeVisible();

  // Step 2: Enter a title for the printout
  const titleInput = page.getByRole('textbox', { name: 'Title' });
  await titleInput.fill('Map Export Test');

  // Step 3: Select the PNG file format
  // The format selector is a combobox. We need to open it and select PNG.
  const formatCombobox = page.getByRole('combobox', { name: 'Format' });
  await formatCombobox.click();

  // Wait for the options to appear and click PNG
  await expect(page.getByRole('option', { name: 'PNG' })).toBeVisible();
  await page.getByRole('option', { name: 'PNG' }).click();

  // Step 4: Click the export/print button
  // Set up download listener before triggering the action
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: /Export|Print/ }).click(),
  ]);

  // Verify the download started and has the correct suggested filename
  await expect(download.suggestedFilename()).toMatch(/\.png$/);
});
