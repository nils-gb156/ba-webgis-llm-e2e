// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // 1. Open the printing panel by clicking the print toggle button.
  // The toggle button is visible by default. We click it to open the panel.
  const printToggle = page.getByTestId('print-toggle');
  await printToggle.click();

  // Wait for the printing panel to become visible.
  const printingPanel = page.getByTestId('printing-panel');
  await expect(printingPanel).toBeVisible();

  // 2. Enter a title for the printout.
  // We look for an input field inside the printing panel. Since specific test IDs for inputs
  // inside the printing panel are not provided in the UI map, we use getByRole('textbox')
  // scoped to the printing panel.
  const titleInput = printingPanel.getByRole('textbox');
  await expect(titleInput).toBeVisible();
  await titleInput.fill('Map Export Test');

  // 3. Select the PNG file format.
  // We look for a radio button or dropdown for format selection.
  // Assuming a radio group or similar control for format selection inside the panel.
  // We'll try to find a radio button with text "PNG".
  const pngFormatOption = printingPanel.getByRole('radio', { name: 'PNG' });
  // If it's a radio, it might not be checked initially. We click it to ensure selection.
  // If it's already checked, clicking might deselect it, so we check state first.
  // However, usually in these scenarios, we just ensure it's selected.
  // Let's assume clicking it ensures selection or it's already selected.
  // To be safe, we check if it's checked. If not, click.
  const isPngChecked = await pngFormatOption.isChecked();
  if (!isPngChecked) {
    await pngFormatOption.click();
  }

  // 4. Click the export/print button.
  // We look for a button inside the printing panel with text "Export" or "Print".
  const exportButton = printingPanel.getByRole('button', { name: /export|print/i });
  await expect(exportButton).toBeVisible();

  // Wait for the download to start before clicking the button.
  const downloadPromise = page.waitForEvent('download');
  await exportButton.click();

  // Wait for the download to complete and verify the file.
  const download = await downloadPromise;
  const suggestedFilename = download.suggestedFilename();
  expect(suggestedFilename).toMatch(/\.png$/i);
});
