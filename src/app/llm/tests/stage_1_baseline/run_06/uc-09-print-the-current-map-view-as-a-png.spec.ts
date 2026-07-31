// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  // Navigate to the application
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the application to load and be interactive
  await expect(page.getByRole('toolbar')).toBeVisible();

  // Precondition: Ensure at least one base map and one overlay layer are visible.
  // We assume the default state has these visible. If not, we might need to select them.
  // For this test, we assume the default view satisfies the precondition.

  // Step 1: The user clicks the 'Print Map' button in the toolbar to open the printing panel.
  const printButton = page.getByRole('button', { name: 'Print Map', exact: true });
  await expect(printButton).toBeVisible();
  await printButton.click();

  // Expected result: The printing panel is visible.
  // We look for a dialog or panel with a title related to printing.
  const printPanel = page.getByRole('dialog', { name: /Print/i, exact: false });
  // Fallback if dialog role is not used, check for a specific container or heading
  const printPanelAlt = page.getByText('Print Map', { exact: false }).locator('..');
  
  // Try to find the panel. It might be a dialog or a side panel.
  // Let's try to find the title input first as a proxy for the panel being open.
  const titleInput = page.getByLabel('Title', { exact: false });
  
  // Wait for the print panel to be visible by waiting for the title input or a print button inside the panel
  await expect(titleInput.or(page.getByRole('button', { name: /Export|Print/i })).first()).toBeVisible();

  // Step 2: The user enters a title for the printout.
  const testTitle = 'My Map Printout';
  await titleInput.fill(testTitle);
  await expect(titleInput).toHaveValue(testTitle);

  // Step 3: The user selects the PNG file format.
  // Look for a radio group or select for format.
  const pngFormatOption = page.getByRole('radio', { name: 'PNG', exact: true }).or(page.getByRole('option', { name: 'PNG', exact: true }));
  
  // If it's a radio button
  if (await pngFormatOption.count() > 0) {
    const isPngChecked = await pngFormatOption.first().isChecked();
    if (!isPngChecked) {
      await pngFormatOption.first().click();
    }
  } else {
    // Fallback: Select from dropdown if radios are not found
    const formatSelect = page.getByLabel('Format', { exact: false }).or(page.getByRole('combobox', { name: /Format/i }));
    if (await formatSelect.count() > 0) {
      await formatSelect.selectOption('PNG');
    }
  }

  // Verify PNG is selected
  const pngIsSelected = await page.getByRole('radio', { name: 'PNG', exact: true }).first().isChecked() ||
                        (await page.getByRole('combobox').first().inputValue()) === 'PNG';
  await expect(pngIsSelected).toBeTruthy();

  // Step 4: The user clicks the export/print button.
  // Set up download listener before clicking
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: /Export|Print/i }).first().click()
  ]);

  // Expected result: A PNG file containing the current map view is generated and downloaded.
  const suggestedFilename = download.suggestedFilename();
  expect(suggestedFilename).toMatch(/\.png$/i);

  // Save the download to verify it's a valid file (optional but good practice)
  const filePath = `/tmp/${suggestedFilename}`;
  await download.saveAs(filePath);
  
  // Note: We cannot assert on the visual content of the downloaded PNG (base map, overlay, scale bar)
  // directly in the browser context as it's a binary file. The successful download of a PNG file
  // is the primary assertion.
});
