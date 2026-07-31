// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready and layers to be rendered
  await expect(page.getByTestId('map-container')).toBeVisible();
  await expect.poll(() => page.getByTestId('coordinate-viewer').innerText()).toBeTruthy();

  // Step 1: Open the printing panel by clicking the print toggle in the toolbar
  const printToggle = page.getByTestId('print-toggle');
  // Ensure the panel is not already open before clicking, or toggle correctly
  const printingPanel = page.getByTestId('printing-panel');
  const panelIsVisible = await printingPanel.isVisible();
  
  if (!panelIsVisible) {
    await printToggle.click();
  }

  // Verify printing panel is visible
  await expect(printingPanel).toBeVisible();

  // Step 2: Enter a title for the printout
  // Assuming there is a text input for the title inside the printing panel
  // We look for a label or input related to "Title" or similar within the panel
  const titleInput = printingPanel.getByLabel(/title/i, { exact: true });
  if (titleInput.count() > 0) {
    await titleInput.fill('Test Printout');
  } else {
    // Fallback if label is not exact or different structure
    const titleField = printingPanel.getByRole('textbox', { name: /title/i });
    if (titleField.count() > 0) {
      await titleField.fill('Test Printout');
    }
  }

  // Step 3: Select the PNG file format
  // Look for radio buttons or a select for format inside the printing panel
  const formatRadioPng = printingPanel.getByRole('radio', { name: /png/i, exact: true });
  if (formatRadioPng.count() > 0) {
    await formatRadioPng.click();
  } else {
    // Fallback to checkbox or select if radios are not used
    const formatSelect = printingPanel.getByRole('combobox', { name: /format/i });
    if (formatSelect.count() > 0) {
      await formatSelect.selectOption({ label: /png/i });
    }
  }

  // Step 4: Click the export/print button
  const exportButton = printingPanel.getByRole('button', { name: /export|print|generate/i, exact: true });
  
  // Set up download listener before clicking
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    exportButton.click()
  ]);

  // Verify the file was downloaded and has a PNG extension
  const suggestedFilename = download.suggestedFilename();
  expect(suggestedFilename).toMatch(/\.png$/i);
});
