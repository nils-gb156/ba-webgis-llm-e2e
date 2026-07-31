// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready and layers to render
  await expect.poll(() => page.evaluate(() => (globalThis as any).__openPioneerMap)).toBeTruthy();
  await expect(page.getByTestId('map-container')).toBeVisible();

  // Step 1: Open the printing panel
  const printToggle = page.getByTestId('print-toggle');
  // Ensure the panel is not already open to avoid toggling it closed
  const printingPanel = page.getByTestId('printing-panel');
  const isPanelVisible = await printingPanel.isVisible();
  if (!isPanelVisible) {
    await printToggle.click();
  }
  
  // Assert the printing panel is visible
  await expect(printingPanel).toBeVisible();

  // Step 2: Enter a title for the printout
  // Assuming there is an input for the title inside the printing panel.
  // Since no specific test id for the title input is in the UI map, we look for a label or role.
  // Common patterns: "Title", "Print Title", etc.
  // We will try to find an input within the printing panel.
  const titleInput = printingPanel.getByRole('textbox', { name: /title/i });
  await expect(titleInput).toBeVisible();
  await titleInput.fill('My Map Printout');

  // Step 3: Select the PNG file format
  // Assuming there is a radio group or select for format.
  // We look for a radio button or option labeled "PNG" within the printing panel.
  const pngOption = printingPanel.getByRole('radio', { name: 'PNG' }).or(printingPanel.getByRole('option', { name: 'PNG' })).or(printingPanel.getByText('PNG').first());
  
  // If it's a radio button, click it. If it's a select, we might need to click a select first.
  // Let's assume standard radio buttons for format selection in such panels.
  const pngRadio = printingPanel.getByRole('radio', { name: 'PNG' });
  if (await pngRadio.isVisible()) {
    await pngRadio.click();
  } else {
    // Fallback: Try to find a select and choose PNG
    const formatSelect = printingPanel.getByRole('combobox', { name: /format/i });
    if (await formatSelect.isVisible()) {
      await formatSelect.selectOption('PNG');
    } else {
      // Last resort: Click a button or text that looks like PNG selection
      const pngButton = printingPanel.getByText('PNG');
      if (await pngButton.isVisible()) {
        await pngButton.click();
      } else {
        throw new Error('Could not find PNG format selection control');
      }
    }
  }

  // Step 4: Click the export/print button
  const exportButton = printingPanel.getByRole('button', { name: /export|print/i });
  await expect(exportButton).toBeVisible();
  
  // Wait for the download to start
  const downloadPromise = page.waitForEvent('download');
  await exportButton.click();

  // Assert download happened
  const download = await downloadPromise;
  const suggestedFilename = download.suggestedFilename();
  expect(suggestedFilename).toMatch(/\.png$/i);
});
