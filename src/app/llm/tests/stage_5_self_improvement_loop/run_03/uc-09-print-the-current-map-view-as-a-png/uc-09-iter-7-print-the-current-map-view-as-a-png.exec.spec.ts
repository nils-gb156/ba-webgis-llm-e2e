// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '../../../failure-snapshot-fixture';
import { getMapZoomLevel, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Precondition: At least one base map and one overlay layer are visible.
  // Verify base layer is active and map is ready
  await expect.poll(() => getMapZoomLevel(page)).toBeGreaterThan(0);
  await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

  // Step 1: The user clicks the 'Print Map' button in the toolbar to open the printing panel.
  const printToggle = page.getByRole('button', { name: 'Print Map' });
  await printToggle.click();

  // Expected result: The printing panel is visible.
  // The printing panel is a dialog. We assert its visibility and the presence of the title input.
  await expect(page.getByRole('dialog', { name: 'Print Map' })).toBeVisible();
  await expect(page.getByLabel('Title')).toBeVisible();

  // Step 2: The user enters a title for the printout.
  const titleInput = page.getByLabel('Title');
  await titleInput.fill('Test Printout');

  // Step 3: The user selects the PNG file format.
  // The format is a combobox. We need to click it to open the options, then select PNG.
  const formatCombobox = page.getByRole('combobox', { name: 'File format' });
  await formatCombobox.click();
  // The option is inside the dialog. Use exact name to avoid ambiguity.
  // The option element itself may not be clickable, so we use force: true.
  await page.getByRole('dialog', { name: 'Print Map' }).getByRole('option', { name: 'PNG' }).click({ force: true });

  // Verify the combobox now shows PNG
  await expect(formatCombobox).toHaveValue('png');

  // Step 4: The user clicks the export/print button.
  // We need to find the export/print button. It is labeled "Export map".
  const exportButton = page.getByRole('button', { name: 'Export map' });

  // Prepare for download
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    exportButton.click()
  ]);

  // Expected result: A PNG file containing the current map view is generated and downloaded.
  const suggestedFilename = download.suggestedFilename();
  expect(suggestedFilename).toMatch(/\.png$/);
});
