// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Ensure map is ready and layers are visible
  await expect(page.getByTestId('map-container')).toBeVisible();
  await expect(page.getByTestId('scale-bar')).toBeVisible();

  // Step 1: Click the 'Print Map' button to open the printing panel
  const printToggle = page.getByRole('button', { name: 'Print Map' });
  await printToggle.click();

  // Verify the printing panel is visible
  // The panel might be the info-panel or a specific dialog. Based on context, it's likely part of the UI flow.
  // We look for elements typically found in a print dialog, such as title input or format selection.
  // Since no specific test-id for the print panel is given, we rely on the presence of the print form elements.
  // We can assert that the print toggle is now in an active state or that a print-specific UI appears.
  // Let's assume the print panel appears within the main view or as a modal.
  // We will wait for a text field that looks like a title input to appear.
  await expect(page.getByLabel('Title')).toBeVisible();

  // Step 2: Enter a title for the printout
  await page.getByLabel('Title').fill('Test Map Print');

  // Step 3: Select the PNG file format
  // Look for a radio button or select for format.
  // Assuming a radio button or similar control for format selection.
  const pngFormatOption = page.getByRole('radio', { name: 'PNG' }).or(page.getByRole('option', { name: 'PNG' }));
  // If it's a radio button, click it. If it's a select, we might need to select.
  // Let's try clicking the PNG option if it's a radio.
  if (await pngFormatOption.count() > 0) {
    const isRadio = await pngFormatOption.first().getAttribute('role') === 'radio';
    if (isRadio) {
      await pngFormatOption.click();
    } else {
      // Fallback for select
      await page.getByRole('combobox').selectOption('png');
    }
  } else {
    // Fallback: try to find a checkbox or other control for PNG
    await page.getByRole('checkbox', { name: 'PNG' }).check();
  }

  // Step 4: Click the export/print button
  const exportButton = page.getByRole('button', { name: /Export|Print|Download/i });
  await exportButton.click();

  // Expected result: A PNG file is generated and downloaded.
  // Wait for the download event
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    exportButton.click() // Click again if the first click didn't trigger it immediately or if we need to re-trigger
  ]);

  // Verify the download started and has the correct suggested filename
  await expect(download.suggestedFilename()).toMatch(/.*\.png$/);
});
