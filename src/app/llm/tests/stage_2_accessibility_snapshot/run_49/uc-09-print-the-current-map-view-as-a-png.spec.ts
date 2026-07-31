// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for initial load to ensure base map and overlays are visible
  await expect(page.getByTestId('map-container')).toBeVisible();
  await expect(page.getByTestId('scale-bar')).toBeVisible();

  // Step 1: Open the printing panel
  await page.getByRole('button', { name: 'Print Map' }).click();

  // Verify the printing panel is visible
  // The print toggle is in the toolbar, clicking it should open a panel.
  // We look for the print dialog/panel. Since no specific testid is given for the panel itself,
  // we might look for a title or form elements associated with printing.
  // Often print dialogs have a title or specific inputs.
  // Let's assume the print panel appears and contains a title input.
  // We can check for the presence of a print-related dialog or form.
  // Since we don't have a specific testid for the print panel, we'll look for the title input
  // which is part of Step 2.

  // Step 2: Enter a title for the printout
  // We need to find the title input. It's likely inside the print panel.
  // Let's try to find an input with a label or placeholder related to "Title".
  // If the print panel is a dialog, we can scope by dialog role.
  const printPanel = page.getByRole('dialog', { name: /Print/i }).or(page.getByRole('region', { name: /Print/i }));
  
  // If the above doesn't find it, we might need to look for the input directly if the panel has a distinct role.
  // Let's try finding the input by its likely label or placeholder.
  const titleInput = page.getByLabel(/Title/i).or(page.getByPlaceholder(/Title/i)).or(page.getByRole('textbox', { name: /Title/i }));
  
  // If we can't find it via label, we might need to rely on the context of the print panel.
  // Let's assume the print panel is visible and contains the input.
  await expect(titleInput).toBeVisible({ timeout: 5000 });
  await titleInput.fill('My Map Printout');

  // Step 3: Select the PNG file format
  // Look for a radio button or select for format.
  const pngFormatOption = page.getByRole('radio', { name: 'PNG' }).or(page.getByRole('option', { name: 'PNG' }));
  await expect(pngFormatOption).toBeVisible({ timeout: 3000 });
  await pngFormatOption.click();

  // Step 4: Click the export/print button
  const exportButton = page.getByRole('button', { name: /Export/i }).or(page.getByRole('button', { name: /Print/i })).or(page.getByRole('button', { name: /Download/i }));
  await expect(exportButton).toBeVisible({ timeout: 3000 });
  
  // Wait for download to start before clicking
  const downloadPromise = page.waitForEvent('download');
  await exportButton.click();

  // Verify the download occurred
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toContain('.png');
});
