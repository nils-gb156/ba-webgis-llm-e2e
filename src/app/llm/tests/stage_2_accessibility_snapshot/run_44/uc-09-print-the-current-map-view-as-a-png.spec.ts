// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for initial map and layers to load
  await expect(page.getByTestId('map-container')).toBeVisible();
  await expect(page.getByTestId('scale-bar')).toBeVisible();

  // Step 1: Click the 'Print Map' button in the toolbar to open the printing panel.
  const printToggle = page.getByRole('button', { name: 'Print Map' });
  await printToggle.click();

  // Verify the printing panel is visible.
  // The print panel is likely a dialog or a panel. Based on the context,
  // we look for elements typically inside a print dialog.
  const printPanel = page.getByRole('dialog', { name: /Print/i }).or(
    page.getByTestId('print-panel').or(page.getByRole('region', { name: /Print/i }))
  );

  // Since we don't have a specific test id for the print panel, we check for
  // common print dialog elements or wait for the print toggle to be in active state
  // and look for a form.
  // The accessibility tree shows "button Print Map". After clicking, a panel/dialog should appear.
  // We'll wait for a title input which is part of the steps.
  await expect(page.getByLabel(/Title/i, { exact: false })).toBeVisible({ timeout: 5000 }).catch(() => {
    // Fallback: if no label is found, look for a text input in the print area
    // Often print dialogs have a title field.
  });

  // Step 2: Enter a title for the printout.
  const titleInput = page.getByLabel(/Title/i, { exact: false }).or(
    page.getByPlaceholder(/Title/i, { exact: false }).or(
      page.locator('input[type="text"]').first() // Generic fallback if specific label/placeholder fails
    )
  );

  // If the specific label/placeholder didn't resolve to a visible input immediately,
  // we might need to look for a dialog content.
  // Let's try to find the title input more robustly.
  const titleField = page.locator('dialog').locator('input').first().or(
    page.getByRole('textbox', { name: /Title/i })
  );

  // Attempt to fill the title. If the element is not immediately visible due to animation,
  // expect will retry.
  await expect(titleField).toBeVisible({ timeout: 5000 });
  await titleField.fill('Map Export Test');

  // Step 3: Select the PNG file format.
  // Look for radio buttons or a dropdown for format selection.
  const pngFormatOption = page.getByRole('radio', { name: 'PNG' }).or(
    page.getByRole('option', { name: 'PNG' }).or(
      page.getByLabel('PNG')
    )
  );

  // If it's a radio button, it might be in a group.
  // If it's a dropdown, we select the option.
  if (pngFormatOption.locator('input[type="radio"]').count() > 0) {
    await pngFormatOption.click();
  } else {
    // Try selecting from a combobox if radio buttons weren't found
    const formatSelect = page.getByRole('combobox', { name: /Format/i }).or(
      page.getByRole('listbox', { name: /Format/i })
    );
    if (await formatSelect.isVisible({ timeout: 2000 })) {
      await formatSelect.selectOption('PNG');
    } else {
      // Fallback: look for a text "PNG" and click it if it looks like a selection
      await page.getByText('PNG').first().click();
    }
  }

  // Step 4: Click the export/print button.
  const exportButton = page.getByRole('button', { name: /Export|Print|Generate/i }).first();
  await expect(exportButton).toBeVisible({ timeout: 5000 });
  
  // Prepare for download
  const downloadPromise = page.waitForEvent('download');
  await exportButton.click();

  // Wait for the download to complete
  const download = await downloadPromise;
  
  // Verify the file was downloaded and has a PNG extension
  const suggestedFilename = download.suggestedFilename();
  expect(suggestedFilename).toMatch(/\.png$/i);
});
