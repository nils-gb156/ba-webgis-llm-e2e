// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Step 1: Open the printing panel
  await page.getByTestId('print-toggle').click({ force: true });
  await expect(page.getByTestId('printing-panel')).toBeVisible();

  // Step 2: Enter a title for the printout
  // Assuming the printing panel contains a text input for the title.
  // Since no specific test-id is given for the title input, we look for a label or role.
  // Common pattern: label "Title" or similar.
  const titleInput = page.getByLabel(/title/i);
  await expect(titleInput).toBeVisible();
  await titleInput.fill('My Map Printout');

  // Step 3: Select the PNG file format
  // Assuming a radio group or dropdown for format.
  // Looking for a radio button or option with "PNG".
  const pngOption = page.getByRole('radio', { name: /png/i }).or(page.getByRole('option', { name: /png/i }));
  // Fallback: if it's a dropdown, we might need to select it differently.
  // Given the complexity, let's assume a radio button for format selection as it's common in print dialogs.
  // If it's a dropdown, we would use selectOption. Let's try radio first.
  if (await pngOption.count() === 0) {
    // Fallback to dropdown if radio not found
    const formatSelect = page.getByLabel(/format/i);
    await expect(formatSelect).toBeVisible();
    await formatSelect.selectOption('png');
  } else {
    await pngOption.click({ force: true });
  }

  // Step 4: Click the export/print button
  // Expecting a button with text "Print", "Export", "Download", or similar.
  const exportButton = page.getByRole('button', { name: /print|export|download/i });
  await expect(exportButton).toBeVisible();
  
  // Wait for download before clicking
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    exportButton.click()
  ]);

  // Assert that a file was downloaded
  const suggestedFilename = download.suggestedFilename();
  expect(suggestedFilename).toMatch(/\.png$/i);
});
