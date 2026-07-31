// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';

test('9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Step 1: Open the printing panel
  const printToggle = page.getByTestId('print-toggle');
  await printToggle.click();

  // Verify the printing panel is visible
  await expect(page.getByRole('dialog', { name: 'Print Map' })).toBeVisible();

  // Step 2: Enter a title for the printout
  const titleInput = page.getByRole('textbox', { name: 'Title' });
  await titleInput.fill('Map Export Test');

  // Step 3: Select the PNG file format
  // The format selector is a combobox. We need to open it and select PNG.
  const formatCombobox = page.getByRole('combobox', { name: 'File format' });
  await formatCombobox.click();

  // Wait for the options to appear and click PNG
  // Use force: true because Chakra UI renders the actual <option> elements visually hidden
  // and the decorative control element intercepts pointer events.
  // The option is inside the dialog, so we scope it there to avoid ambiguity.
  const dialog = page.getByRole('dialog', { name: 'Print Map' });
  const pngOption = dialog.getByRole('option', { name: 'PNG' });
  await pngOption.click({ force: true });

  // Verify the combobox now shows PNG as selected
  await expect(formatCombobox).toHaveAttribute('aria-expanded', 'false');
  await expect(formatCombobox).toHaveText('PNG');

  // Step 4: Click the export/print button
  // Set up download listener before triggering the action
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Export map' }).click(),
  ]);

  // Verify the download started and has the correct suggested filename
  await expect(download.suggestedFilename()).toMatch(/\.png$/);
});
