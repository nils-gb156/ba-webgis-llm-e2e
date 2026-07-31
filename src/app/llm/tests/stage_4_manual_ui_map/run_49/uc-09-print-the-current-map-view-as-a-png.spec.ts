// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Step 1: Open the printing panel
  await page.getByTestId('print-toggle').click();

  // Verify the printing panel is visible
  await expect(page.getByTestId('printing-panel')).toBeVisible();

  // Step 2: Enter a title for the printout
  // Assuming the printing panel contains an input for the title.
  // Based on typical UI patterns, we look for a label or placeholder.
  // If a specific test id exists for the title input, we would use getByTestId.
  // Since it's not explicitly listed in the UI map for the printing panel elements,
  // we fall back to getByLabel or getByRole. Let's assume a label "Title" or similar.
  // However, without specific test IDs for the printing panel internals, we might need to
  // rely on the structure. Let's look for an input within the printing panel.
  const printingPanel = page.getByTestId('printing-panel');
  
  // Attempt to find a title input. Often it's a text input.
  // We will try to find an input that might be for the title.
  // If the UI map doesn't specify, we might need to guess or use a generic locator.
  // Let's assume there is a label "Title" or an input with placeholder "Title".
  const titleInput = printingPanel.getByLabel('Title').or(printingPanel.getByPlaceholder('Title'));
  
  // If getByLabel fails, we might need to be more generic. 
  // Let's try to find any text input in the panel if specific locators fail.
  // But best practice is to use accessible names.
  // Let's assume the label is "Title".
  await titleInput.fill('My Map Print');

  // Step 3: Select the PNG file format
  // Assuming there is a radio button or dropdown for format.
  // Let's look for a radio group or dropdown labeled "Format" or similar.
  const formatRadio = printingPanel.getByRole('radio', { name: 'PNG' });
  
  // If radio buttons are used, we click the specific one.
  // If it's a dropdown, we would use selectOption.
  // Given "selects the PNG file format", it could be either.
  // Let's assume radio buttons for simplicity if not specified.
  // If it's a dropdown, we might use: printingPanel.getByLabel('Format').selectOption('png');
  // Let's try to find a role that matches.
  if (await formatRadio.isVisible()) {
    await formatRadio.click();
  } else {
    // Fallback to dropdown if radio not found
    const formatSelect = printingPanel.getByLabel('Format');
    await formatSelect.selectOption('png');
  }

  // Step 4: Trigger the export/print
  // Look for an export or print button in the printing panel
  const exportButton = printingPanel.getByRole('button', { name: /Export|Print|Generate/i });
  
  // Wait for the download to start before clicking
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    exportButton.click()
  ]);

  // Verify the download was successful
  expect(download.suggestedFilename()).toMatch(/\.png$/);
});
