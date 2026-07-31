// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle, isLayerRendered } from "../../../map-model-helpers";

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  // Navigate to the application
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Verify preconditions: Map is loaded with a base layer and at least one overlay
  await expect.poll(() => getActiveBaseLayerTitle(page)).toBeTruthy();
  await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);

  // Step 1: Open the printing panel
  const printToggle = page.getByTestId('print-toggle');
  const printPanel = page.getByTestId('printing-panel');

  // Ensure the printing panel is not already open before clicking
  const isPrintPanelVisible = await printPanel.isVisible().catch(() => false);
  if (!isPrintPanelVisible) {
    await printToggle.click({ force: true });
  }

  // Wait for the printing panel to be visible
  await expect(printPanel).toBeVisible();

  // Step 2: Enter a title for the printout
  // The printing panel contains an input for the title. We look for a text input within the panel.
  const titleInput = printPanel.getByRole('textbox', { name: /title/i });
  await expect(titleInput).toBeVisible();
  await titleInput.fill('Test Map Printout');

  // Step 3: Select the PNG file format
  // Look for a radio button or select option for PNG within the printing panel
  const pngFormatOption = printPanel.getByRole('radio', { name: 'PNG', exact: true }).or(
    printPanel.getByRole('option', { name: 'PNG', exact: true })
  );

  // If it's a radio button, click it. If it's a select, we might need to click the select first.
  // Based on typical UI patterns, let's try to find a radio button first.
  const pngRadio = printPanel.getByRole('radio', { name: 'PNG' });
  const isPngRadioChecked = await pngRadio.isChecked().catch(() => false);
  if (!isPngRadioChecked) {
    await pngRadio.click({ force: true });
  }

  // Step 4: Click the export/print button
  const exportButton = printPanel.getByRole('button', { name: /export|print|generate/i });
  await expect(exportButton).toBeVisible();

  // Wait for the download to start before clicking the button
  const downloadPromise = page.waitForEvent('download');
  await exportButton.click();

  // Wait for the download to complete and verify the file
  const download = await downloadPromise;
  const suggestedFilename = download.suggestedFilename();
  expect(suggestedFilename).toMatch(/\.png$/);
});
