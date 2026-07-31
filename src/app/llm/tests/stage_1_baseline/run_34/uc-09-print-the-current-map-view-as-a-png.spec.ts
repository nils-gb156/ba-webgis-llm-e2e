// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('UC9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready and layers to be visible before interacting.
  // We rely on the presence of the map canvas and the toolbar being interactive.
  await page.waitForSelector('[data-testid="map-container"]');
  await expect(page.locator('[data-testid="map-canvas"]')).toBeVisible();

  // Step 1: Click the 'Print Map' button in the toolbar to open the printing panel.
  const printButton = page.getByRole('button', { name: 'Print Map', exact: true });
  await expect(printButton).toBeVisible();
  await printButton.click();

  // Verify the printing panel is visible.
  const printPanel = page.getByRole('dialog', { name: /Print/i });
  await expect(printPanel).toBeVisible();

  // Step 2: Enter a title for the printout.
  const titleInput = printPanel.getByLabel('Title');
  await expect(titleInput).toBeVisible();
  await titleInput.fill('Test Printout');

  // Step 3: Select the PNG file format.
  // Assuming the format selector is a dropdown or radio group labeled 'Format' or similar.
  // Using getByRole('combobox') or 'listbox' depending on implementation, but 'combobox' is common for select-like.
  // If it's a radio group, we use radio. Let's assume a combobox/select for format.
  const formatSelect = printPanel.getByLabel('Format');
  await expect(formatSelect).toBeVisible();
  
  // Click to open the dropdown if it's a select/combobox, then select PNG.
  // Alternatively, if it's a radio, we click the PNG radio.
  // Given "hard" complexity, let's try to be robust. Often formats are radio buttons or a select.
  // Let's look for a radio button with text "PNG" inside the dialog first.
  const pngRadio = printPanel.getByRole('radio', { name: 'PNG', exact: true });
  if (await pngRadio.isVisible()) {
    // Check if it's already checked
    const isChecked = await pngRadio.isChecked();
    if (!isChecked) {
      await pngRadio.click();
    }
  } else {
    // Fallback to select/combobox
    await formatSelect.click();
    const pngOption = page.getByRole('option', { name: 'PNG', exact: true });
    await expect(pngOption).toBeVisible();
    await pngOption.click();
  }

  // Step 4: Click the export/print button.
  const exportButton = printPanel.getByRole('button', { name: /Print|Export|Download/i, exact: true });
  await expect(exportButton).toBeVisible();

  // Wait for the download to start before clicking, to capture the file.
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    exportButton.click()
  ]);

  // Verify the download happened and check the suggested filename.
  const suggestedFilename = download.suggestedFilename();
  expect(suggestedFilename).toMatch(/\.png$/i);

  // Clean up the download file.
  await download.delete();

  // Note: We cannot assert on the content of the downloaded image (base map, overlay, scale bar)
  // directly in Playwright without external image processing libraries, which are not standard.
  // The successful download of a PNG file is the primary verifiable outcome for the "download" step.
});
