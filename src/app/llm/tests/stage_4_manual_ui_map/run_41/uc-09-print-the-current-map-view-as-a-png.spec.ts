// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Step 1: Open the printing panel
  const printToggle = page.getByTestId('print-toggle');
  const printingPanel = page.getByTestId('printing-panel');

  // Ensure the panel is not already open before clicking
  const isPanelVisible = await printingPanel.isVisible();
  if (!isPanelVisible) {
    await printToggle.click();
  }

  // Wait for the printing panel to become visible
  await expect(printingPanel).toBeVisible();

  // Step 2: Enter a title for the printout
  // We look for an input field within the printing panel.
  // Based on typical UI patterns, it might be labeled "Title" or similar.
  // If no specific label is found, we might need to rely on placeholder or position.
  // However, the prompt doesn't specify the exact input test-id for title.
  // Let's assume there's an input inside the printing panel.
  // We will try to find an input field inside the printing panel.
  const titleInput = printingPanel.locator('input').first();
  await expect(titleInput).toBeVisible();
  await titleInput.fill('Test Map Print');

  // Step 3: Select the PNG file format
  // We look for a radio button or dropdown for format selection.
  // Assuming a radio group or similar control inside the printing panel.
  // Let's look for a radio button labeled "PNG".
  const pngRadio = printingPanel.getByRole('radio', { name: 'PNG' });
  await expect(pngRadio).toBeVisible();
  // Clicking the radio button might require force if it's a custom control
  await pngRadio.click({ force: true });

  // Step 4: Trigger the export/print
  // We look for an export or print button inside the printing panel.
  const exportButton = printingPanel.getByRole('button', { name: /export|print/i });
  await expect(exportButton).toBeVisible();

  // Wait for the download to start
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    exportButton.click()
  ]);

  // Assert that the file was downloaded and has a PNG extension
  const suggestedFilename = download.suggestedFilename();
  expect(suggestedFilename).toMatch(/\.png$/);
});
