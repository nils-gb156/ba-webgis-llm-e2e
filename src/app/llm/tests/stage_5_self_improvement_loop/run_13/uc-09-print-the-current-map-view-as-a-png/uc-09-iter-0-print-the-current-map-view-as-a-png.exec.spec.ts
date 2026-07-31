// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '../../../failure-snapshot-fixture';
import { getMapZoomLevel, getMapCenter, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Ensure map is ready and layers are rendered
  await expect.poll(() => getMapZoomLevel(page)).toBeDefined();

  // Precondition: At least one base map and one overlay layer are visible
  await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

  // Step 1: Open the printing panel
  await page.getByTestId('print-toggle').click({ force: true });

  // Verify printing panel is visible
  await expect(page.getByRole('dialog', { name: /Print Map/i })).toBeVisible();

  // Step 2: Enter a title for the printout
  const titleInput = page.getByRole('textbox', { name: 'Title' });
  await titleInput.fill('Test Print Map');

  // Step 3: Select the PNG file format
  const pngFormat = page.getByRole('radio', { name: 'PNG' });
  // Ensure PNG is not already selected
  const isPngChecked = await pngFormat.isChecked();
  if (!isPngChecked) {
    await pngFormat.click({ force: true });
  }

  // Step 4: Click the export/print button
  // Wait for the download to start before clicking the export button
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: /Print|Export/i }).click(),
  ]);

  // Verify the downloaded file has a PNG extension
  const suggestedFilename = download.suggestedFilename();
  expect(suggestedFilename).toMatch(/\.png$/);

  // Verify the print dialog is closed after export
  await expect(page.getByRole('dialog', { name: /Print Map/i })).not.toBeVisible();
});
