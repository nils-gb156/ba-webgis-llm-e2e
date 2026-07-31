// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapZoomLevel, getMapCenter, getActiveBaseLayerTitle, isLayerRendered } from '../../../map-model-helpers';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Precondition: Ensure map is loaded and has some content
  await expect.poll(() => getMapZoomLevel(page)).toBeDefined();
  await expect.poll(() => getActiveBaseLayerTitle(page)).toBeDefined();

  // Step 1: Open the printing panel
  const printToggle = page.getByTestId('print-toggle');
  // Ensure the toggle is not already pressed (active) before clicking
  const isPrintPanelOpen = await page.getByTestId('printing-panel').isVisible();
  if (!isPrintPanelOpen) {
    await printToggle.click();
  }

  // Verify printing panel is visible
  await expect(page.getByTestId('printing-panel')).toBeVisible();

  // Step 2: Enter a title for the printout
  // Assuming the printing panel contains an input for the title.
  // Based on common patterns, we look for a label or input within the panel.
  // Since no specific testid for the title input is provided, we use getByRole within the panel.
  const printingPanel = page.getByTestId('printing-panel');
  const titleInput = printingPanel.getByLabel(/Title/i);
  if (titleInput) {
    await titleInput.fill('Test Map Printout');
  } else {
    // Fallback if label is not found, try to find any input
    const anyInput = printingPanel.locator('input[type="text"]');
    await anyInput.fill('Test Map Printout');
  }

  // Step 3: Select the PNG file format
  // Assuming there is a radio group or select for format.
  // We look for "PNG" within the printing panel.
  const pngOption = printingPanel.getByRole('radio', { name: 'PNG', exact: true }).first();
  if (await pngOption.isVisible()) {
    await pngOption.click();
  } else {
    // Fallback: Look for a select or other control
    const formatSelect = printingPanel.getByRole('combobox', { name: /Format/i });
    if (await formatSelect.isVisible()) {
      await formatSelect.selectOption('png');
    } else {
      // Last resort: click on text "PNG" if it's a button or clickable div
      await printingPanel.getByText('PNG').click();
    }
  }

  // Step 4: Trigger the export/print button
  // We expect a download to occur.
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    printingPanel.getByRole('button', { name: /Print|Export|Download/i }).first().click()
  ]);

  // Verify the download happened and has a PNG extension
  const suggestedFilename = download.suggestedFilename();
  expect(suggestedFilename.toLowerCase()).toMatch(/\.png$/);

  // Verify the printing panel remains visible or closes gracefully (depending on app behavior)
  // The use case says "printing panel is visible", implying it stays open or was visible during interaction.
  // We already asserted it was visible after opening.
});
