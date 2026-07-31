// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Ensure the map is ready and layers are visible
  await expect(page.getByTestId('map-container')).toBeVisible();
  await expect(page.getByRole('checkbox', { name: 'EUCOS Ground Stations' })).toBeChecked();
  await expect(page.getByRole('checkbox', { name: 'Temperature' })).toBeChecked();

  // Step 1: Click the 'Print Map' button to open the printing panel
  const printButton = page.getByRole('button', { name: 'Print Map' });
  await printButton.click();

  // Verify the printing panel is visible
  // The print panel is likely a dialog or panel. We look for the print toggle being pressed or a dialog.
  // Based on context, we might see a dialog or the panel appearing.
  // Let's wait for the print dialog/panel to appear. It might be identified by a heading or specific content.
  // Since no specific test id for the print panel is given, we look for the "Print Map" button state or a dialog.
  // Often print dialogs have a title or specific inputs.
  // Let's assume the print panel appears and contains a title input and format selector.
  
  // We need to find the print panel. It's not explicitly in the test ids.
  // However, the prompt says "The printing panel is visible".
  // Let's look for a dialog or panel that contains "Print" or similar.
  // Since we don't have a specific test id for the print panel, we might need to rely on the presence of the title input or format selector.
  // Let's try to find the title input first. If it's in a dialog, we can scope to the dialog.
  
  // Let's assume the print panel is a dialog with a title like "Print Map" or similar.
  // If not, it might be a panel in the sidebar.
  // Given the complexity, let's try to locate the title input by its label or placeholder.
  
  // Step 2: Enter a title for the printout
  // We need to find the title input. It might be labeled "Title" or have a placeholder.
  // Let's try to find an input with a placeholder or label related to title.
  // If we can't find it by role, we might need to use a text-based locator.
  
  // Let's try to find the print panel by looking for the print toggle being active or a dialog.
  // Since we clicked the print button, the panel should be open.
  
  // Let's assume the print panel contains a text input for the title.
  // We'll try to find it by its label or placeholder.
  const titleInput = page.getByLabel('Title').or(page.getByPlaceholder('Title'));
  // If the above doesn't work, we might need to be more specific.
  // Let's try to find the input by its test id if it exists, but it's not in the list.
  // Let's try to find the input by its role and accessible name.
  
  // Alternative: Look for a dialog/panel that appears after clicking Print Map.
  // We can wait for a dialog with a specific name if it exists.
  // Let's try to find the title input by its placeholder "Title" or similar.
  
  // Let's try to find the print panel by looking for the "Export" or "Print" button inside it.
  // We can wait for the export button to be visible.
  const exportButton = page.getByRole('button', { name: /Export|Print/ }).first();
  await expect(exportButton).toBeVisible({ timeout: 5000 });
  
  // Now we know the print panel is visible. Let's find the title input and format selector within this panel.
  // We can scope our search to the panel/dialog.
  // Let's try to find the closest parent container that represents the print panel.
  // It might be a dialog.
  const printPanel = page.getByRole('dialog', { name: /Print/ }).or(page.locator('body').locator('div:has(> button:has-text("Export"))').first());
  
  // If the above doesn't work, we might need to use a different strategy.
  // Let's try to find the title input by its label.
  const titleInputLocator = page.getByLabel('Title').or(page.getByPlaceholder('Enter title'));
  await expect(titleInputLocator).toBeVisible({ timeout: 5000 });
  
  // Step 2: Enter a title
  await titleInputLocator.fill('Test Printout');
  
  // Step 3: Select the PNG file format
  // We need to find the format selector. It might be a radio group, dropdown, or buttons.
  // Let's try to find a radio button or option for "PNG".
  const pngOption = page.getByRole('radio', { name: 'PNG' }).or(page.getByRole('option', { name: 'PNG' })).or(page.getByRole('button', { name: 'PNG' }));
  await expect(pngOption).toBeVisible({ timeout: 5000 });
  await pngOption.click();
  
  // Step 4: Click the export/print button
  // We already identified the export button earlier.
  await exportButton.click();
  
  // Expected result: A PNG file is downloaded.
  // We need to wait for the download.
  const download = await page.waitForEvent('download');
  const suggestedFilename = download.suggestedFilename();
  expect(suggestedFilename).toMatch(/\.png$/i);
});
