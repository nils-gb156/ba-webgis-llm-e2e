// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  // Navigate to the application
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map and initial UI to be ready
  await expect(page.getByTestId('map-container')).toBeVisible();
  await expect(page.getByTestId('layer-switcher')).toBeVisible();

  // Step 1: The user clicks the 'Print Map' button in the toolbar to open the printing panel.
  const printButton = page.getByRole('button', { name: 'Print Map' });
  await printButton.click();

  // Verify the printing panel is visible.
  // The print panel is likely part of the map-controls-panel or a modal.
  // We look for a dialog or panel that contains print-specific inputs.
  // Based on typical UI patterns, we might see a dialog or an expanded panel.
  // Let's assume the print controls appear in the map-controls-panel or a dedicated dialog.
  // We will wait for a text input that looks like a title field to appear.
  await expect(page.getByLabel('Title')).toBeVisible({ timeout: 10000 });

  // Step 2: The user enters a title for the printout.
  const titleInput = page.getByLabel('Title');
  await titleInput.fill('Test Map Printout');

  // Step 3: The user selects the PNG file format.
  // We look for a radio button or select element for format.
  const pngFormatOption = page.getByRole('radio', { name: 'PNG' }).or(page.getByRole('option', { name: 'PNG' }));
  
  // If it's a radio button group
  if (await pngFormatOption.count() > 0) {
    await pngFormatOption.click();
  } else {
    // Fallback: look for a select box
    const formatSelect = page.getByLabel('Format');
    if (await formatSelect.count() > 0) {
      await formatSelect.selectOption('PNG');
    } else {
      // Last resort: look for any text "PNG" and click it if it's interactive
      const pngText = page.getByText('PNG');
      await pngText.click();
    }
  }

  // Step 4: The user clicks the export/print button.
  // We need to capture the download before clicking.
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: /Print|Export|Generate/i }).click()
  ]);

  // Verify the download started and has a PNG extension
  const suggestedFilename = download.suggestedFilename();
  expect(suggestedFilename.toLowerCase()).toMatch(/\.png$/);

  // Clean up the download
  await download.cancel();
});
