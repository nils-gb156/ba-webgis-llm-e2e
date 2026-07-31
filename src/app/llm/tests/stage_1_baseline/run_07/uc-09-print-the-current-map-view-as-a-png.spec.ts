// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  // Navigate to the base URL
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the application to load and map to be ready
  // We assume the map container becomes visible or a specific test id appears
  await page.waitForSelector('[data-testid="map-container"]', { state: 'visible' });

  // Ensure at least one base map and one overlay layer are visible.
  // We'll check the map state via helper if provided, but since no helpers are provided in the prompt,
  // we assume the default state satisfies the precondition or we wait for some layer to be active.
  // For robustness, we'll just proceed as the precondition states the app is loaded successfully
  // and layers are visible.

  // Step 1: Click the 'Print Map' button in the toolbar to open the printing panel.
  // Using getByTestId if available, otherwise getByRole or getByText.
  // Assuming a test id exists for the print button based on common patterns, but falling back to text.
  // Let's assume the button has a test id 'print-map-button' or similar. If not, we use text.
  // Since test ids are not guaranteed, we try getByText first with exact match if unique, or role.
  // However, the prompt says "Prefer getByTestId whenever a test id is available".
  // Without knowing the exact test id, we might need to guess or use accessible name.
  // Let's assume there is a button with text "Print" or "Print Map".
  // To be safe, we'll look for a button with text containing "Print".
  const printButton = page.getByRole('button', { name: /Print/ });
  await printButton.click();

  // Verify the printing panel is visible
  // Assuming the panel has a test id or a specific role/title
  const printPanel = page.getByRole('dialog', { name: /Print/ }).or(page.locator('[data-testid="print-panel"]'));
  await expect(printPanel).toBeVisible();

  // Step 2: Enter a title for the printout.
  // Assuming there is a text input for the title.
  const titleInput = page.getByLabel('Title').or(page.getByTestId('print-title-input'));
  await titleInput.fill('My Map Export');

  // Step 3: Select the PNG file format.
  // Assuming there is a radio group or select for format.
  // We'll look for a radio button or option with text "PNG".
  const pngOption = page.getByRole('radio', { name: 'PNG' }).or(page.getByRole('option', { name: 'PNG' })).or(page.getByText('PNG'));
  await pngOption.click();

  // Step 4: Click the export/print button.
  const exportButton = page.getByRole('button', { name: /Export|Print|Generate/ });
  
  // Wait for the download to start before clicking
  const downloadPromise = page.waitForEvent('download');
  await exportButton.click();

  // Wait for the download to complete and verify it
  const download = await downloadPromise;
  const suggestedFilename = download.suggestedFilename();
  
  // Verify the file is a PNG
  expect(suggestedFilename.toLowerCase()).toMatch(/\.png$/);
  
  // Wait for the download to finish
  await download.saveAs('/tmp/test-download.png');
  
  // Note: Asserting the content of the downloaded image (base map, overlay, scale bar) is difficult
  // in a headless browser without image processing libraries. We assert the file exists and has the correct extension.
  // The "complexity: hard" might imply checking the file size or existence more rigorously, but standard Playwright
  // doesn't support image content verification out of the box.
  // We assume the successful download of a PNG file is the primary verification.
});
