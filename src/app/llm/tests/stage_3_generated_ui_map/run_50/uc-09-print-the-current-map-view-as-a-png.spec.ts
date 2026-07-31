// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapZoomLevel, isLayerRendered, getActiveBaseLayerTitle } from '../../../map-model-helpers';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Precondition: Ensure map is ready and layers are visible
  await expect.poll(() => getActiveBaseLayerTitle(page)).toBeTruthy();
  await expect.poll(() => getMapZoomLevel(page)).toBeGreaterThan(0);
  await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);
  await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);
  await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

  // Step 1: Click the 'Print Map' button in the toolbar to open the printing panel.
  await page.getByTestId('print-toggle').click({ force: true });

  // Expected result: The printing panel is visible.
  await expect(page.getByTestId('printing-panel')).toBeVisible();

  // Step 2: The user enters a title for the printout.
  const printTitle = 'Test Printout';
  const titleInput = page.getByRole('textbox', { name: /title/i, exact: true }).first();
  // The title input might be inside the printing panel
  const printingPanel = page.getByTestId('printing-panel');
  const titleField = printingPanel.getByRole('textbox', { name: 'Title' });
  await expect(titleField).toBeVisible();
  await titleField.fill(printTitle);

  // Step 3: The user selects the PNG file format.
  const formatSelect = printingPanel.getByRole('combobox', { name: /format/i });
  await expect(formatSelect).toBeVisible();
  await formatSelect.selectOption('png');

  // Step 4: The user clicks the export/print button.
  const exportButton = printingPanel.getByRole('button', { name: /export|print/i });
  await expect(exportButton).toBeVisible();

  // Wait for the download to start before clicking
  const downloadPromise = page.waitForEvent('download');
  await exportButton.click();

  const download = await downloadPromise;
  const suggestedFilename = download.suggestedFilename();
  
  // Expected result: A PNG file containing the current map view is generated and downloaded.
  expect(suggestedFilename).toMatch(/\.png$/);
  
  // Clean up the downloaded file
  await download.delete();
});
