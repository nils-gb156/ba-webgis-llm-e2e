// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Step 1: Open the printing panel by clicking the print toggle in the toolbar.
  // The printing panel is initially hidden, so we click the toggle to open it.
  const printToggle = page.getByTestId('print-toggle');
  await printToggle.click();

  // Verify the printing panel is visible
  await expect(page.getByTestId('printing-panel')).toBeVisible();

  // Step 2: Enter a title for the printout.
  // Assuming there is an input field for the title inside the printing panel.
  // We look for a text input within the printing panel.
  const titleInput = page.getByTestId('printing-panel').getByRole('textbox', { name: /title/i });
  // If a specific test id for the title input exists, use it. Otherwise, fallback to accessible name.
  // Based on common patterns, let's try to find a title input.
  // If no specific test id is provided in the UI map for the title input, we use getByRole.
  // Let's assume a generic title input or label.
  const titleField = page.getByTestId('printing-panel').getByLabel(/title/i) || 
                     page.getByTestId('printing-panel').getByRole('textbox', { name: /title/i });
  await titleField.fill('Test Printout');

  // Step 3: Select the PNG file format.
  // We look for a radio button or select option for PNG.
  // Assuming a radio group or select for format.
  const pngFormatOption = page.getByTestId('printing-panel').getByRole('radio', { name: 'PNG' }) ||
                          page.getByTestId('printing-panel').getByRole('option', { name: 'PNG' });
  
  // If it's a radio button, click it. If it's a select, we might need to select it differently.
  // Let's assume it's a radio button for simplicity based on common UI patterns for format selection.
  if (await pngFormatOption.isVisible()) {
    await pngFormatOption.click();
  } else {
    // Fallback: try to find a select and choose PNG
    const formatSelect = page.getByTestId('printing-panel').getByRole('combobox', { name: /format/i });
    if (await formatSelect.isVisible()) {
      await formatSelect.selectOption('PNG');
    }
  }

  // Step 4: Click the export/print button.
  const exportButton = page.getByTestId('printing-panel').getByRole('button', { name: /export|print/i });
  
  // Wait for the download to start before clicking the button
  const downloadPromise = page.waitForEvent('download');
  await exportButton.click();

  // Wait for the download to complete
  const download = await downloadPromise;
  
  // Assert that the file was downloaded and has a PNG extension
  const suggestedFilename = download.suggestedFilename();
  expect(suggestedFilename.toLowerCase()).toMatch(/\.png$/);
});
