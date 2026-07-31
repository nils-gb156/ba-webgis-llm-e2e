// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // 1. Open the printing panel by clicking the print toggle.
  // The toggle is visible by default. We check its state to avoid toggling it off if it's already open.
  const printToggle = page.getByTestId('print-toggle');
  const isPrintTogglePressed = await printToggle.getAttribute('aria-pressed');
  
  if (isPrintTogglePressed !== 'true') {
    await printToggle.click();
  }

  // Verify the printing panel is visible
  const printingPanel = page.getByTestId('printing');
  await expect(printingPanel).toBeVisible();

  // 2. Enter a title for the printout.
  // We look for an input inside the printing panel. Based on common patterns, it might be a label or generic input.
  // Since no specific testid for the title input is provided in the UI map, we look for a label or input near the "Title" text.
  // We'll use getByRole with 'textbox' or 'input' scoped to the printing panel.
  // Assuming there's a label "Title" or similar. If not, we might need to rely on placeholder or just the first input.
  // Let's assume there is a text input for the title.
  const titleInput = page.getByTestId('printing').getByRole('textbox', { name: /title/i }).first();
  
  // If the above is too strict, we might need to find the input by placeholder.
  // However, getByRole is preferred. Let's try to find it.
  // If the UI map doesn't specify, we might have to guess or use a broader selector.
  // Let's assume there is an input with a testid or label. 
  // Since the UI map is manual, let's assume standard ARIA.
  // If we can't find it by role/name, we might fallback to getByPlaceholder or similar.
  // For now, let's assume we can find it.
  // If the test fails here, it might be because the input doesn't have an accessible name.
  // Let's try to find any input in the printing panel.
  const printingInput = page.getByTestId('printing').getByRole('textbox');
  await printingInput.fill('My Map Printout');

  // 3. Select the PNG file format.
  // We look for a radio button or select option for PNG.
  // Assuming there's a group of radio buttons or a select for format.
  // Let's assume radio buttons with labels "PNG", "JPEG", etc.
  const pngRadio = page.getByTestId('printing').getByRole('radio', { name: 'PNG' });
  await pngRadio.check();

  // 4. Click the export/print button.
  // We look for a button with text "Print", "Export", or "Download".
  const exportButton = page.getByTestId('printing').getByRole('button', { name: /print|export|download/i });
  
  // Wait for download before clicking
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    exportButton.click()
  ]);

  // Verify the download
  const suggestedFilename = download.suggestedFilename();
  expect(suggestedFilename).toMatch(/\.png$/i);
});
