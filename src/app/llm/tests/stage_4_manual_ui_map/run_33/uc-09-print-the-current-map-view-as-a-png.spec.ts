// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle, isLayerRendered } from '../../../map-model-helpers';

test('UC9: Print the current map view as a PNG', async ({ page }) => {
  // Precondition: App loaded, base map and overlay visible
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for map to be ready and base layer to be active
  await expect.poll(() => getActiveBaseLayerTitle(page)).toBeTruthy();

  // Wait for at least one operational layer to be rendered
  await expect.poll(() => isLayerRendered(page, 'Temperature')).resolves.toBe(true);

  // Step 1: Open printing panel
  const printToggle = page.getByTestId('print-toggle');
  // Check current state to avoid closing if already open
  const isPrintPanelOpen = await page.getByTestId('printing-panel').isVisible();
  if (!isPrintPanelOpen) {
    await printToggle.click();
  }

  // Verify printing panel is visible
  await expect(page.getByTestId('printing-panel')).toBeVisible();

  // Step 2: Enter a title for the printout
  // Assuming the printing panel contains an input for the title.
  // Based on typical UI patterns and the UI map, we look for a text input inside the printing panel.
  // Since no specific testid for the title input is provided in the UI map, we fall back to getByRole or getByLabel.
  // We scope it to the printing panel to avoid ambiguity.
  const printingPanel = page.getByTestId('printing-panel');
  const titleInput = printingPanel.getByRole('textbox', { name: /title/i });
  await titleInput.fill('Test Map Printout');

  // Step 3: Select PNG file format
  // Assuming a radio group or dropdown for format selection.
  // We look for a radio button or option labeled "PNG".
  const pngOption = printingPanel.getByRole('radio', { name: 'PNG' });
  if (!(await pngOption.isChecked())) {
    await pngOption.click();
  }

  // Step 4: Trigger export/print
  // Assuming an export or print button.
  const exportButton = printingPanel.getByRole('button', { name: /export|print/i });
  
  // Wait for the download event before clicking
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    exportButton.click()
  ]);

  // Verify download
  const suggestedFilename = download.suggestedFilename();
  expect(suggestedFilename).toMatch(/\.png$/i);
});
