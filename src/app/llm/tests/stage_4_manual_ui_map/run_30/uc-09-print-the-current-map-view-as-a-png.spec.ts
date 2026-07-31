// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Step 1: Open the printing panel
  const printToggle = page.getByTestId('print-toggle');
  await printToggle.click();

  // Verify the printing panel is visible
  await expect(page.getByTestId('printing-panel')).toBeVisible();

  // Step 2: Enter a title for the printout
  // Assuming there is an input for the title inside the printing panel.
  // If not explicitly mapped, we look for a text input or label.
  // Based on typical UI, there might be a title input. Let's assume a generic input or specific testid if available.
  // Since no specific testid for title input is in the map, we look for a label or input inside the printing panel.
  // However, the map model doesn't specify the internal structure of 'printing'.
  // We will assume there is an input field for the title. Let's try to find it by role or text.
  // Often, these panels have a "Title" label.
  const titleInput = page.getByTestId('printing-panel').getByLabel(/Title/i).or(page.getByTestId('printing-title-input'));
  // Fallback if specific testid doesn't exist, try by label. If neither, we might need to inspect.
  // Given the constraints, let's assume a standard input for title.
  // If the UI map doesn't specify, we might have to guess or use a broader locator.
  // Let's try to find any input inside the printing panel.
  const printingPanel = page.getByTestId('printing-panel');
  const titleInputLocator = printingPanel.locator('input[type="text"]').first();
  
  await titleInputLocator.fill('Test Map Print');

  // Step 3: Select the PNG file format
  // Assuming there is a radio group or dropdown for format.
  // Let's look for a radio button or select for "PNG".
  const pngFormatSelector = printingPanel.getByRole('radio', { name: 'PNG' }).or(printingPanel.getByRole('option', { name: 'PNG' }));
  await pngFormatSelector.click();

  // Step 4: Click the export/print button
  const exportButton = printingPanel.getByRole('button', { name: /Export|Print/i });
  
  // Wait for download before clicking
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    exportButton.click()
  ]);

  // Verify the file was downloaded and is a PNG
  const suggestedFilename = download.suggestedFilename();
  expect(suggestedFilename).toMatch(/\.png$/i);
});
