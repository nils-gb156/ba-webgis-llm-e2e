// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';
import { getMapZoomLevel } from '../../../../map-model-helpers';

test('UC9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Ensure map is loaded and zoom level is defined before proceeding
  await expect.poll(() => getMapZoomLevel(page)).toBeDefined();

  // Step 1: Click the 'Print Map' button in the toolbar to open the printing panel
  const printToggle = page.getByTestId('print-toggle');
  await printToggle.click();

  // Verify the printing panel is visible
  // The panel is typically a dialog or a panel within the map-controls-panel
  const printPanel = page.getByRole('dialog', { name: /Print/i }).or(
    page.getByRole('region', { name: /Print/i }),
  );
  await expect(printPanel).toBeVisible();

  // Step 2: Enter a title for the printout
  // Locate the title input inside the print panel
  const titleInput = printPanel.getByLabel(/Title/i);
  if (titleInput) {
    await titleInput.fill('Test Map Printout');
  }

  // Step 3: Select the PNG file format
  // Locate the format selector inside the print panel and select PNG
  const formatSelect = printPanel.getByLabel(/Format/i);
  if (formatSelect) {
    await formatSelect.selectOption('PNG');
  } else {
    // Fallback: if it's a radio button or button group
    const pngOption = printPanel.getByRole('radio', { name: 'PNG' }).or(
      printPanel.getByRole('button', { name: 'PNG' }),
    );
    if (pngOption) {
      await pngOption.click();
    }
  }

  // Step 4: Click the export/print button
  const exportButton = printPanel.getByRole('button', { name: /Print|Export|Generate/i });
  await expect(exportButton).toBeVisible();

  // Wait for the download to start before clicking, in case the click triggers it immediately
  const downloadPromise = page.waitForEvent('download');
  await exportButton.click();

  // Verify the file was downloaded
  const download = await downloadPromise;
  const suggestedFilename = download.suggestedFilename();
  expect(suggestedFilename).toMatch(/\.png$/i);
});
