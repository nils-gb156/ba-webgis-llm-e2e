// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready and default layers to be rendered
  await expect.poll(() => page.evaluate(() => (globalThis as any).__openPioneerMap)).toBeTruthy();
  await expect.poll(() => page.evaluate(() => (globalThis as any).__openPioneerMap?.layers.getActiveBaseLayer()?.title)).toBe('Carto Light');

  // 1. Open the printing panel
  const printToggle = page.getByTestId('print-toggle');
  await printToggle.click();

  // 2. Enter a title for the printout
  // The printing panel is a floating panel. We look for the input inside it.
  // Based on common patterns, the input might be labeled "Title" or similar.
  // If no specific test id is provided for the input, we use getByLabel or getByRole.
  // Assuming the UI exposes a label "Title" or similar for the print title input.
  // If not, we might need to rely on the structure. Let's assume a label "Title".
  const titleInput = page.getByLabel('Title');
  await titleInput.fill('Test Printout');

  // 3. Select the PNG file format
  // The format selector is likely a radio group or dropdown.
  // Assuming a radio button or option labeled "PNG".
  // We need to find the PNG option within the printing panel.
  const printingPanel = page.getByTestId('printing');
  const pngOption = printingPanel.getByRole('radio', { name: 'PNG' }).or(printingPanel.getByRole('option', { name: 'PNG' }));
  
  // If it's a radio, click it. If it's a dropdown, we might need to open it first.
  // Let's assume it's a radio button for simplicity, or a checkbox.
  // If getByRole fails, we might need to look for a button or div with text PNG.
  // Given the complexity, let's try to find the PNG selector by text within the panel.
  const pngSelector = printingPanel.getByText('PNG').first();
  await pngSelector.click();

  // 4. Trigger the export
  // The export button is likely labeled "Export", "Print", or "Download".
  const exportButton = printingPanel.getByRole('button', { name: /Export|Print|Download/i }).first();
  
  // Wait for the download event before clicking
  const downloadPromise = page.waitForEvent('download');
  await exportButton.click();

  const download = await downloadPromise;
  const suggestedFilename = download.suggestedFilename();
  
  // Assert that a file was downloaded and it has a PNG extension
  expect(suggestedFilename).toMatch(/\.png$/i);
});
