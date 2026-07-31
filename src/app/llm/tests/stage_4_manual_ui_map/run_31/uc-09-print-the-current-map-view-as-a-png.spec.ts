// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Step 1: The user clicks the 'Print Map' button in the toolbar to open the printing panel.
  const printToggle = page.getByTestId('print-toggle');
  
  // Ensure the printing panel is toggled on.
  // If it's already open, clicking it would close it, so we only click if it's not visible.
  const printingPanel = page.getByTestId('printing-panel');
  const isPrintingPanelVisible = await printingPanel.isVisible();
  if (!isPrintingPanelVisible) {
    await printToggle.click();
  }

  // Verify the printing panel is visible
  await expect(printingPanel).toBeVisible();

  // Step 2: The user enters a title for the printout.
  // We need to find the title input inside the printing panel.
  // Based on the UI map, the printing-panel contains a 'printing' element.
  // Usually, there's an input for title. Let's assume a standard label or test id.
  // Since the UI map doesn't specify the exact input test id for title, we look for common patterns.
  // Often it's `getByLabel('Title')` or similar. Let's try to find an input inside the panel.
  const titleInput = printingPanel.getByRole('textbox', { name: /title/i });
  await expect(titleInput).toBeVisible();
  await titleInput.fill('My Map Printout');

  // Step 3: The user selects the PNG file format.
  // We need to find the format selector. It's likely a radio group or dropdown.
  // Let's look for a radio button or label containing "PNG".
  const pngOption = printingPanel.getByRole('radio', { name: 'PNG' }).or(printingPanel.getByRole('option', { name: 'PNG' })).or(printingPanel.getByText('PNG'));
  
  // If it's a radio button, we click it. If it's a dropdown, we might need to select it.
  // Let's try clicking the PNG radio/button first.
  const pngElements = await printingPanel.locator('text=PNG').all();
  if (pngElements.length > 0) {
      // Try to click the first PNG element found
      await pngElements[0].click();
  } else {
      // Fallback: try to find a select/dropdown and pick PNG
      const formatSelect = printingPanel.getByRole('combobox', { name: /format/i });
      if (await formatSelect.isVisible()) {
          await formatSelect.selectOption('png');
      }
  }

  // Step 4: The user clicks the export/print button.
  // Look for an export or print button inside the printing panel.
  const exportButton = printingPanel.getByRole('button', { name: /export|print/i });
  await expect(exportButton).toBeVisible();

  // Wait for the download to start
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    exportButton.click()
  ]);

  // Verify the download
  expect(download.suggestedFilename()).toMatch(/\.png$/);
});
