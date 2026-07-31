// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Step 1: Open the printing panel
  await page.getByTestId('print-toggle').click();

  // Verify the printing panel is visible
  await expect(page.getByTestId('printing-panel')).toBeVisible();

  // Step 2: Enter a title for the printout
  // Assuming the printing panel contains an input for the title.
  // Since no specific test-id for the title input is provided in the UI map,
  // we try to find it by role or label within the printing panel.
  const titleInput = page.getByTestId('printing-panel').getByRole('textbox', { name: /title/i });
  await expect(titleInput).toBeVisible();
  await titleInput.fill('Test Map Printout');

  // Step 3: Select the PNG file format
  // Assuming there is a radio group or dropdown for format selection.
  // We look for a radio button or option labeled "PNG".
  const pngFormatOption = page.getByTestId('printing-panel').getByRole('radio', { name: 'PNG', exact: true });
  // If it's a dropdown, getByRole('radio') might fail. Let's try a more generic approach if radio fails,
  // but usually format selection is radio buttons.
  // If the UI uses a select/dropdown, we would use getByRole('listbox') or similar.
  // Given the ambiguity, let's assume standard radio buttons for format.
  // If it's not visible, it might be the default or we need to click to open a select.
  // Let's try clicking the PNG option. If it's a radio, it should be visible.
  // If it's inside a select, we might need to interact differently.
  // However, "select the PNG file format" implies an explicit action.
  // Let's assume there is a radio button or a selectable item.
  
  // Fallback: If radio is not found, maybe it's a dropdown.
  // But without specific test IDs, we rely on accessible names.
  // Let's try to find any interactive element with "PNG" in the printing panel.
  const pngSelector = page.getByTestId('printing-panel').getByText('PNG', { exact: true });
  
  // Check if it's a radio button or something else
  const isRadio = await pngSelector.first().getAttribute('role') === 'radio';
  
  if (isRadio) {
    await pngSelector.first().check();
  } else {
    // It might be a dropdown option. We need to open the dropdown first if it's closed.
    // Or it might be a button.
    // Let's try clicking it.
    await pngSelector.first().click();
  }

  // Step 4: Click the export/print button
  const exportButton = page.getByTestId('printing-panel').getByRole('button', { name: /export|print/i });
  await expect(exportButton).toBeVisible();
  
  // Wait for the download to start
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    exportButton.click()
  ]);

  // Verify the download happened and suggest a filename
  const suggestedFilename = download.suggestedFilename();
  expect(suggestedFilename).toMatch(/\.png$/i);
});
