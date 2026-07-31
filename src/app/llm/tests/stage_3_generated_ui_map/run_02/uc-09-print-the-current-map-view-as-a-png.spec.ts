// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map and basic UI to be ready
  await expect(page.getByTestId('map-container')).toBeVisible();
  await expect(page.getByTestId('info-panel')).toBeVisible();

  // Step 1: Open the printing panel by clicking the print toggle
  // The print-toggle is not active by default, so we click it to open the panel
  const printToggle = page.getByTestId('print-toggle');
  await printToggle.click();

  // Verify the printing panel is visible
  await expect(page.getByTestId('printing-panel')).toBeVisible();

  // Step 2: Enter a title for the printout
  // We look for an input field inside the printing panel.
  // Since no specific test id is given for the title input, we use getByRole
  // scoped to the printing panel. Assuming the input has a label or placeholder.
  // Common labels might be "Title", "Map Title", etc.
  // If no label is present, we might need to rely on placeholder or just the first input.
  // Let's try to find an input inside the panel.
  const printingPanel = page.getByTestId('printing-panel');
  const titleInput = printingPanel.getByRole('textbox', { name: /title/i });
  
  // Fallback if specific name isn't found, try any textbox
  if (!(await titleInput.count())) {
    const anyTextbox = printingPanel.getByRole('textbox');
    await expect(anyTextbox).toBeVisible();
    await anyTextbox.fill('My Printed Map');
  } else {
    await expect(titleInput).toBeVisible();
    await titleInput.fill('My Printed Map');
  }

  // Step 3: Select the PNG file format
  // Look for a radio button or select element for format inside the printing panel
  const formatRadio = printingPanel.getByRole('radio', { name: 'PNG' });
  if (await formatRadio.count()) {
    await expect(formatRadio).toBeVisible();
    await formatRadio.click();
  } else {
    // Fallback: maybe it's a select or button group
    const formatSelect = printingPanel.getByRole('combobox', { name: /format/i });
    if (await formatSelect.count()) {
      await formatSelect.selectOption('png');
    } else {
      // Try clicking a button labeled PNG
      const pngButton = printingPanel.getByRole('button', { name: 'PNG' });
      if (await pngButton.count()) {
        await pngButton.click();
      } else {
        // Last resort: look for any element containing "PNG"
        const pngElement = printingPanel.getByText('PNG');
        await expect(pngElement).toBeVisible();
        // If it's just text, maybe it's already selected or we can't interact.
        // Assuming standard UI, there should be an interactive element.
      }
    }
  }

  // Step 4: Trigger the export/print
  // Look for an export or print button inside the printing panel
  const exportButton = printingPanel.getByRole('button', { name: /export|print/i });
  await expect(exportButton).toBeVisible();

  // Wait for the download to start before clicking
  const downloadPromise = page.waitForEvent('download');
  await exportButton.click();

  // Verify the download
  const download = await downloadPromise;
  const suggestedFilename = download.suggestedFilename();
  expect(suggestedFilename).toMatch(/\.png$/);
});
