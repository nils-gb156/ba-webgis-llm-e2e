// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Step 1: Open the printing panel
  // The print-toggle button toggles the printing-panel.
  // We click it to ensure the panel is open.
  await page.getByTestId('print-toggle').click();

  // Verify the printing panel is visible
  await expect(page.getByTestId('printing-panel')).toBeVisible();

  // Step 2: Enter a title for the printout
  // We assume there is an input for the title inside the printing panel.
  // Since no specific test id is given for the title input, we look for a label or role.
  // Common pattern: an input with a label like "Title" or "Map Title".
  // Let's try to find an input inside the printing panel.
  const titleInput = page.getByTestId('printing-panel').getByRole('textbox', { name: /title/i });
  await titleInput.fill('My Map Printout');

  // Step 3: Select the PNG file format
  // We assume there is a radio group or dropdown for format selection.
  // Let's look for a radio button or option for "PNG".
  const pngOption = page.getByTestId('printing-panel').getByRole('radio', { name: /PNG/i });
  // If it's a radio, we click it. If it's a dropdown, we might need to select it.
  // Given the context of "selecting format", radio buttons are common in print dialogs.
  // However, if it's a select element, getByRole('radio') won't work.
  // Let's assume radio buttons for now as they are distinct. If not, we might need to check for a select.
  // A safer bet for "selecting format" in a toolbar/panel context might be a select dropdown or radio group.
  // Let's try to find a select element first.
  const formatSelect = page.getByTestId('printing-panel').getByRole('combobox', { name: /format/i });
  
  if (await formatSelect.count() > 0) {
    // It's a dropdown/select
    await formatSelect.selectOption('PNG');
  } else {
    // Fallback to radio buttons
    await pngOption.click();
  }

  // Step 4: Click the export/print button
  // We look for a button with text "Print", "Export", or "Generate" inside the printing panel.
  const printButton = page.getByTestId('printing-panel').getByRole('button', { name: /print|export|generate/i });
  
  // Wait for the download to start before clicking
  const downloadPromise = page.waitForEvent('download');
  await printButton.click();

  // Verify the download
  const download = await downloadPromise;
  const suggestedFilename = download.suggestedFilename();
  expect(suggestedFilename).toMatch(/\.png$/);
});
