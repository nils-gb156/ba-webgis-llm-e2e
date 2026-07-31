// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Precondition check: Ensure map is loaded and initial layers are visible
  await expect(page.getByTestId('map-container')).toBeVisible();
  await expect(page.getByRole('checkbox', { name: 'EUCOS Ground Stations' })).toBeChecked();
  await expect(page.getByRole('checkbox', { name: 'Temperature' })).toBeChecked();

  // Step 1: Click the 'Print Map' button to open the printing panel
  const printButton = page.getByRole('button', { name: 'Print Map' });
  await printButton.click();

  // Verify the printing panel is visible
  // The panel is likely a dialog or a section that appears. Based on the context, it's part of the map controls or a modal.
  // We look for the panel by checking for elements that would only be present in the print view.
  // Since there's no specific test id for the print panel itself, we infer its presence by the appearance of print-specific controls.
  // Common print UI elements: Title input, Format selector, Export button.
  // Let's assume the print panel appears and contains a title input and format options.
  // We will wait for the print dialog/panel to appear by checking for a common print-related element or just proceeding if the button click triggers it.
  // Given the complexity, we'll assume the print interface becomes interactive.
  // A robust way is to check for the presence of a "Format" or "Title" field typical of print dialogs.
  // Let's try to find a dialog or a specific panel. If not, we rely on the existence of print controls.
  // Since we don't have a specific test ID for the print panel, we'll look for the title input which is a key step.
  await expect(page.getByLabel(/Title/i)).toBeVisible({ timeout: 5000 });

  // Step 2: Enter a title for the printout
  const titleInput = page.getByLabel(/Title/i);
  await titleInput.fill('Test Printout');

  // Step 3: Select the PNG file format
  // We look for a radio button or option for PNG.
  const pngOption = page.getByRole('radio', { name: 'PNG' }).or(page.getByLabel('PNG'));
  // If radio is not available, it might be a select or checkbox. Let's try radio first.
  if (await pngOption.count() === 0) {
    // Fallback to checkbox or text if radio isn't found
    await page.getByRole('checkbox', { name: 'PNG' }).check();
  } else {
    await pngOption.click();
  }

  // Step 4: Click the export/print button
  const exportButton = page.getByRole('button', { name: /Export|Print|Generate/i });
  
  // Prepare for download
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    exportButton.click()
  ]);

  // Verify download
  const suggestedFilename = download.suggestedFilename();
  expect(suggestedFilename).toMatch(/\.png$/i);
  
  // Clean up the downloaded file
  await download.delete();
});
