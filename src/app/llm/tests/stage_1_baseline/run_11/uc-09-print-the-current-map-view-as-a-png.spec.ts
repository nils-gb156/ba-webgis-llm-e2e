// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready and layers to be visible before proceeding
  await expect(page.getByTestId('map-container')).toBeVisible();

  // Step 1: The user clicks the 'Print Map' button in the toolbar to open the printing panel.
  const printButton = page.getByRole('button', { name: 'Print Map' });
  await expect(printButton).toBeVisible();
  await printButton.click();

  // Verify the printing panel is visible
  const printPanel = page.getByRole('dialog', { name: /Print/i });
  await expect(printPanel).toBeVisible();

  // Step 2: The user enters a title for the printout.
  const titleInput = printPanel.getByLabel(/Title/i);
  await expect(titleInput).toBeVisible();
  await titleInput.fill('Test Map Print');

  // Step 3: The user selects the PNG file format.
  // We need to find the format selector. It might be a radio group, dropdown, or list.
  // Assuming a common pattern for format selection in such panels.
  const formatSelector = printPanel.getByRole('radiogroup', { name: /Format/i })
    .or(printPanel.getByRole('combobox', { name: /Format/i }))
    .or(printPanel.getByRole('listbox', { name: /Format/i }));
  
  // If it's a radio group, select PNG
  if (await formatSelector.isVisible({ timeout: 1000 }).catch(() => false)) {
    const pngRadio = formatSelector.getByRole('radio', { name: 'PNG' });
    await expect(pngRadio).toBeVisible();
    await pngRadio.click();
  } else {
    // Fallback: try to find a button or option labeled PNG within the panel
    const pngOption = printPanel.getByRole('button', { name: 'PNG' }).or(printPanel.getByText('PNG'));
    await expect(pngOption).toBeVisible();
    await pngOption.click();
  }

  // Step 4: The user clicks the export/print button.
  // Set up download listener before triggering the action
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    printPanel.getByRole('button', { name: /Export|Print|Generate/i }).click()
  ]);

  // Verify the download started and has the correct filename extension
  const suggestedFilename = download.suggestedFilename();
  expect(suggestedFilename).toMatch(/\.png$/);

  // Clean up the download file
  await download.cancel();
});
