// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Precondition: at least one base map and one overlay layer are visible.
  await expect.poll(() => getActiveBaseLayerTitle(page)).toBeTruthy();
  await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

  // Step 4 (setup): Register the download listener before the trigger.
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    // Step 1: Click the 'Print Map' button to open the printing panel.
    page.getByRole('button', { name: 'Print Map' }).click(),
  ]);

  // Wait for the print dialog/panel to appear.
  await expect(page.getByRole('dialog', { name: /Print Map/i })).toBeVisible();

  // Step 2: Enter a title for the printout.
  const titleInput = page.getByRole('textbox', { name: 'Title' });
  await titleInput.fill('Test Printout');

  // Step 3: Select the PNG file format.
  // The format is typically a combobox or radio group. We try to set the select/combobox first.
  const formatSelect = page.getByRole('combobox', { name: /Format/i });
  if (await formatSelect.count()) {
    await formatSelect.selectOption('png');
  } else {
    // Fallback: look for radio buttons or a different role if it's not a standard combobox.
    const pngRadio = page.getByRole('radio', { name: /PNG/i });
    if (await pngRadio.count()) {
      await pngRadio.check();
    } else {
      // Last resort: try to find an element with "PNG" text and click it.
      await page.getByText('PNG').click();
    }
  }

  // Step 4: Click the export/print button.
  const exportButton = page.getByRole('button', { name: /Export|Print|Generate/i });
  await exportButton.click();

  // Expected result: A PNG file is generated and downloaded.
  const suggestedFilename = download.suggestedFilename();
  expect(suggestedFilename).toMatch(/\.png$/);
});
