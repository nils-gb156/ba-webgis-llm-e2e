// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Precondition: Ensure at least one base map and one overlay layer are visible.
  // The accessibility tree shows "EUCOS Ground Stations" and "Temperature" are checked.
  // We assume the base map is already set to "Carto Light" as per the combobox state.

  // Step 1: The user clicks the 'Print Map' button in the toolbar to open the printing panel.
  const printToggle = page.getByRole('button', { name: 'Print Map' });
  await printToggle.click();

  // Expected result: The printing panel is visible.
  // We look for a dialog or panel related to printing. Since no specific testid is provided
  // for the print dialog itself, we look for the title or a common print-related element.
  // Often print dialogs have a title like "Print Map" or similar.
  // Let's wait for the print dialog to appear. We can look for the "Print Map" button being pressed
  // or a dialog with a print-related title.
  // Given the context, let's assume the print panel appears. We can assert visibility of
  // a likely element inside the print panel. A common pattern is a form with a title input.
  // Let's try to find a title input or a print button inside a dialog.
  // Since we don't have a specific testid for the print dialog, we'll rely on the button state
  // or a visible dialog.
  // Let's check if the print toggle is pressed or if a dialog appears.
  // A safer bet is to look for a dialog with "Print" in its name.
  const printDialog = page.getByRole('dialog', { name: /Print/i, includeHidden: false });
  await expect(printDialog).toBeVisible();

  // Step 2: The user enters a title for the printout.
  // We need to find the title input field. It's likely inside the print dialog.
  // Common labels: "Title", "Map Title", "Title for printout".
  const titleInput = page.getByRole('textbox', { name: /title/i, exact: true }).first();
  // If the above is too broad, we might need to scope it to the dialog.
  // Let's try scoping to the print dialog.
  const scopedTitleInput = printDialog.getByRole('textbox', { name: /title/i });
  if (await scopedTitleInput.isVisible()) {
    await scopedTitleInput.fill('My Map Printout');
  } else {
    // Fallback if the name is not exactly "title"
    // Let's look for a label "Title" and then the associated input.
    // Or just a generic textbox if necessary.
    // Let's try to find any textbox in the dialog that isn't the geocoder.
    const allTextboxes = printDialog.getByRole('textbox');
    await allTextboxes.first().fill('My Map Printout');
  }

  // Step 3: The user selects the PNG file format.
  // We need to find the format selector. It's likely a radio group or a dropdown.
  // Common labels: "Format", "File Format", "PNG", "JPEG".
  // Let's look for a radio button or checkbox with "PNG".
  const pngOption = printDialog.getByRole('radio', { name: 'PNG' });
  if (await pngOption.isVisible()) {
    await pngOption.click();
  } else {
    // Fallback: look for a checkbox
    const pngCheckbox = printDialog.getByRole('checkbox', { name: 'PNG' });
    if (await pngCheckbox.isVisible()) {
      await pngCheckbox.click();
    } else {
      // Fallback: look for a select/dropdown
      const formatSelect = printDialog.getByRole('combobox', { name: /format/i });
      if (await formatSelect.isVisible()) {
        await formatSelect.selectOption('PNG');
      } else {
        // Last resort: look for any element with "PNG" text and click it if it looks like an option
        const pngElement = printDialog.getByText('PNG').first();
        await pngElement.click();
      }
    }
  }

  // Step 4: The user clicks the export/print button.
  // We need to find the print/export button.
  // Common labels: "Print", "Export", "Download", "Generate".
  const printButton = printDialog.getByRole('button', { name: /print|export|download|generate/i, exact: true }).first();
  await expect(printButton).toBeVisible();
  
  // Wait for download to start
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    printButton.click()
  ]);

  // Expected result: A PNG file containing the current map view is generated and downloaded.
  // We assert that the download was successful and has a PNG extension.
  const suggestedFilename = download.suggestedFilename();
  expect(suggestedFilename).toMatch(/\.png$/);
  
  // Clean up the downloaded file
  await download.delete();
});
