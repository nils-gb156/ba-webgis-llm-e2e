// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Step 1: Open the printing panel by clicking the print toggle
  await page.getByTestId('print-toggle').click();

  // Verify the printing panel is visible
  await expect(page.getByTestId('printing-panel')).toBeVisible();

  // Step 2: Enter a title for the printout
  // Assuming the printing panel contains an input for the title.
  // Based on typical UI patterns and the lack of specific test id for the title input in the prompt's UI map,
  // we look for a label or role. The UI map mentions "printing-panel" contains "printing".
  // We need to find the title input inside the printing panel.
  // Since no specific test id is provided for the title input, we use getByRole/getByLabel scoped to the panel.
  // Often these are labeled "Title" or similar. If not, we might need to look for an input inside the panel.
  // Let's assume there is a label "Title" or similar. If not, we try to find the first input.
  // However, to be robust, let's look for a label "Title" or "Print Title".
  // If the UI map is incomplete regarding specific inputs, we might have to guess based on common patterns.
  // Let's assume the input has a label "Title".
  const titleInput = page.getByTestId('printing-panel').getByLabel('Title', { exact: true }).or(
    page.getByTestId('printing-panel').getByRole('textbox', { name: 'Title' })
  );
  
  // Fallback: if no label is found, try to find an input inside the printing panel
  const actualTitleInput = titleInput.first() || page.getByTestId('printing-panel').getByRole('textbox').first();
  
  await actualTitleInput.fill('My Map Printout');

  // Step 3: Select the PNG file format
  // Look for a radio group or dropdown for format.
  // Assuming there is a radio button or checkbox for "PNG".
  // We look for a radio button or checkbox labeled "PNG" inside the printing panel.
  const pngOption = page.getByTestId('printing-panel').getByRole('radio', { name: 'PNG', exact: true }).or(
    page.getByTestId('printing-panel').getByRole('checkbox', { name: 'PNG', exact: true })
  );
  
  // If radio/checkbox not found, maybe it's a select/dropdown
  const pngSelect = page.getByTestId('printing-panel').getByRole('combobox').or(
    page.getByTestId('printing-panel').getByRole('listbox')
  );

  // Try to click the radio/checkbox if it exists, otherwise select from dropdown
  if (pngOption.count() > 0) {
    await pngOption.click();
  } else if (pngSelect.count() > 0) {
    await pngSelect.click();
    // Select PNG from the list
    await page.getByRole('option', { name: 'PNG' }).click();
  } else {
    // Fallback: look for any element containing "PNG" and click it, assuming it's the format selector
    await page.getByTestId('printing-panel').getByText('PNG', { exact: true }).click();
  }

  // Step 4: Click the export/print button
  // Look for a button labeled "Print", "Export", "Download", or "Generate" inside the printing panel
  const exportButton = page.getByTestId('printing-panel').getByRole('button', { name: /Print|Export|Download|Generate/i, exact: true }).first();
  
  // Wait for download before clicking
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    exportButton.click()
  ]);

  // Verify the download happened and has a PNG filename
  const suggestedFilename = download.suggestedFilename();
  expect(suggestedFilename.toLowerCase()).toMatch(/\.png$/);
});
