// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';
import { getMapZoomLevel, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Precondition: At least one base map and one overlay layer are visible.
  // Verify base layer is active
  await expect.poll(() => getMapZoomLevel(page)).toBeGreaterThan(0);
  await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

  // Step 1: The user clicks the 'Print Map' button in the toolbar to open the printing panel.
  const printToggle = page.getByRole('button', { name: 'Print Map' });
  await printToggle.click();

  // Expected result: The printing panel is visible.
  // The printing panel is typically a dialog or panel. We look for a role that represents it,
  // or a panel containing print-specific elements like a title input.
  // Based on common patterns, it might be a dialog or a panel with a title.
  // Let's assert that the print panel is visible by looking for a common element within it,
  // like a title input or a format selector.
  await expect(page.getByLabel('Title')).toBeVisible();

  // Step 2: The user enters a title for the printout.
  const titleInput = page.getByLabel('Title');
  await titleInput.fill('Test Printout');

  // Step 3: The user selects the PNG file format.
  // We need to find the format selector. It might be a radio group or a dropdown.
  // Assuming it's a radio group or similar, we look for a "PNG" option.
  const pngFormatOption = page.getByRole('radio', { name: 'PNG' }).or(
    page.getByRole('option', { name: 'PNG' })
  );
  // If it's a dropdown, we might need to click it first.
  // Let's try to find the PNG option directly. If it's not visible, it might be in a dropdown.
  // A common pattern is a dropdown for format.
  const formatDropdown = page.getByRole('combobox', { name: /format/i }).or(
    page.getByRole('button', { name: /format/i })
  );
  if (await formatDropdown.isVisible()) {
    await formatDropdown.click();
    // Wait for options to appear
    await expect(page.getByRole('option', { name: 'PNG' })).toBeVisible();
    await page.getByRole('option', { name: 'PNG' }).click();
  } else {
    // Fallback to radio button if no dropdown
    await page.getByRole('radio', { name: 'PNG' }).click();
  }

  // Step 4: The user clicks the export/print button.
  // We need to find the export/print button. It might be labeled "Print", "Export", or "Download".
  const exportButton = page.getByRole('button', { name: /print|export|download/i, exact: true });
  
  // Prepare for download
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    exportButton.click()
  ]);

  // Expected result: A PNG file containing the current map view is generated and downloaded.
  const suggestedFilename = download.suggestedFilename();
  expect(suggestedFilename).toMatch(/\.png$/);
});
