// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Step 1: Open the printing panel
  // The print-toggle button toggles the printing-panel.
  // We assert it becomes visible.
  await page.getByTestId('print-toggle').click();
  await expect(page.getByTestId('printing-panel')).toBeVisible();

  // Step 2: Enter a title for the printout
  // We look for an input within the printing panel.
  // Since no specific test-id for the title input is given, we use getByLabel or getByRole.
  // Assuming a label like "Title" or similar exists. If not, we might need to inspect.
  // Based on common patterns, let's try to find an input inside the printing panel.
  const printingPanel = page.getByTestId('printing-panel');
  
  // Attempt to find an input for the title. Often labeled "Title" or "Print Title".
  // If there's no specific label, we might have to rely on placeholder or just the first input.
  // Let's assume a label "Title" for now.
  const titleInput = printingPanel.getByLabel(/title/i);
  await expect(titleInput).toBeVisible();
  await titleInput.fill('Test Map Printout');

  // Step 3: Select the PNG file format
  // We look for a radio button or select option for "PNG".
  // Assuming a radio group or select for format.
  // Let's look for a radio button with text "PNG" or label "PNG".
  const pngOption = printingPanel.getByRole('radio', { name: /png/i, exact: true });
  
  // It might be already selected, or we need to select it.
  // If it's a radio, we click it.
  await expect(pngOption).toBeVisible();
  await pngOption.click({ force: true }); // Force click for Chakra radio/checkbox controls

  // Step 4: Trigger the export/print button
  // Look for an export or print button inside the printing panel.
  const exportButton = printingPanel.getByRole('button', { name: /export|print/i, exact: true });
  await expect(exportButton).toBeVisible();

  // Wait for download to start before clicking
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    exportButton.click()
  ]);

  // Assert that a file was downloaded
  const suggestedFilename = download.suggestedFilename();
  expect(suggestedFilename).toMatch(/\.png$/i);
});
