// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  // Navigate to the application base URL
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the application to load and map to be ready
  // We assume the map container is visible after initial load
  const mapContainer = page.getByTestId('map-container');
  await expect(mapContainer).toBeVisible();

  // Step 1: The user clicks the 'Print Map' button in the toolbar to open the printing panel.
  const printButton = page.getByRole('button', { name: 'Print Map' });
  await expect(printButton).toBeVisible();
  await printButton.click();

  // Verify the printing panel is visible
  const printPanel = page.getByRole('dialog', { name: /Print/ });
  // Fallback to a more generic search if the dialog name is not specific enough
  const printDialog = printPanel.count() > 0 ? printPanel : page.getByRole('dialog').first();
  await expect(printDialog).toBeVisible();

  // Step 2: The user enters a title for the printout.
  const titleInput = page.getByLabel('Title');
  await expect(titleInput).toBeVisible();
  await titleInput.fill('Test Map Export');

  // Step 3: The user selects the PNG file format.
  // Assuming there is a select or radio group for format.
  // Trying to find a select element or radio buttons for format.
  const formatSelect = page.getByRole('combobox', { name: /Format/ });
  if (await formatSelect.isVisible()) {
    await formatSelect.selectOption('png');
  } else {
    // Fallback to radio buttons or other inputs if combobox is not found
    const pngOption = page.getByRole('radio', { name: 'PNG' }).or(page.getByRole('option', { name: 'PNG' }));
    if (await pngOption.isVisible()) {
      await pngOption.click();
    } else {
      // Last resort: try to find any input related to format and select PNG
      const formatInput = page.getByTestId('print-format').or(page.getByLabel('Format'));
      if (await formatInput.isVisible()) {
        if (await formatInput.evaluate(el => el.tagName === 'SELECT')) {
          await formatInput.selectOption('png');
        } else {
          await formatInput.fill('png');
        }
      }
    }
  }

  // Step 4: The user clicks the export/print button.
  // Set up the download listener before clicking
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: /Export|Print|Generate/ }).first().click()
  ]);

  // Expected result: A PNG file containing the current map view is generated and downloaded.
  const suggestedFilename = download.suggestedFilename();
  expect(suggestedFilename).toMatch(/\.png$/);

  // Clean up the downloaded file
  await download.delete();
});
