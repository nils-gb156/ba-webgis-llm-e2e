// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Step 1: Click the 'Print Map' button in the toolbar to open the printing panel.
  const printToggle = page.getByTestId('print-toggle');
  
  // Check current state of the toggle to ensure we open the panel, not close it.
  // The panel is toggled by this button. We want it visible.
  await expect(page.getByTestId('printing-panel')).toBeHidden();
  await printToggle.click();

  // Verify the printing panel is visible
  await expect(page.getByTestId('printing-panel')).toBeVisible();

  // Step 2: Enter a title for the printout.
  // We need to find the title input inside the printing panel.
  // Based on typical UI, it's likely a text input with a label or test id.
  // Since no specific test id for the title input is provided in the UI map, 
  // we look for a label or input within the printing panel.
  // Let's assume the input has a label "Title" or similar.
  // If no clear accessible name, we might need to use a generic input locator within the panel.
  // However, the prompt says "enter a title". Let's look for an input inside the printing panel.
  // We will use `getByRole('textbox')` scoped to the printing panel.
  const titleInput = page.getByTestId('printing-panel').getByRole('textbox', { name: /title/i });
  await titleInput.fill('Map Export Test');

  // Step 3: Select the PNG file format.
  // We need to find the format selection control.
  // It's likely a radio group or a dropdown.
  // Let's look for a radio button or option labeled "PNG".
  // We'll search for a radio button with name "PNG" inside the printing panel.
  const pngFormatRadio = page.getByTestId('printing-panel').getByRole('radio', { name: 'PNG' });
  await expect(pngFormatRadio).toBeVisible();
  await pngFormatRadio.click();

  // Step 4: Click the export/print button.
  // We need to find the export button.
  // It's likely labeled "Export" or "Print" or "Download".
  const exportButton = page.getByTestId('printing-panel').getByRole('button', { name: /export|print|download/i });
  
  // Wait for download before clicking the button
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    exportButton.click()
  ]);

  // Verify the printing panel is still visible (or closed, depending on implementation, but usually stays open or closes after success)
  // The expected result says "A PNG file ... is generated and downloaded".
  
  // Verify the downloaded file
  const suggestedFilename = download.suggestedFilename();
  expect(suggestedFilename).toMatch(/\.png$/i);
});
