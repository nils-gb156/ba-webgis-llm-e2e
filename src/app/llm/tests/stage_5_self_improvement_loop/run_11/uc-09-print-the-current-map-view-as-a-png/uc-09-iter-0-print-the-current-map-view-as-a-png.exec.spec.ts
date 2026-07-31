// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '../../../failure-snapshot-fixture';
import { getMapZoomLevel } from '../../../../map-model-helpers';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready and zoomed to a reasonable level
  await expect.poll(() => getMapZoomLevel(page)).toBeGreaterThan(0);

  // Step 1: Open the printing panel
  await page.getByRole('button', { name: 'Print Map' }).click();

  // Verify the printing panel is visible
  await expect(page.getByRole('dialog', { name: /Print/ })).toBeVisible();

  // Step 2: Enter a title for the printout
  await page.getByLabel('Title').fill('Test Printout');

  // Step 3: Select the PNG file format
  // The format selector is likely a select element or a set of radio buttons.
  // Based on typical UI patterns, we try to find a radio button or select option for PNG.
  // If it's a select, we use selectOption. If it's radios, we click the PNG radio.
  // Let's assume a common pattern: a radio group or a select.
  // Given the lack of specific test ids for the print dialog internals, we'll use getByRole.
  // If there's a radio button group for format:
  const pngFormatOption = page.getByRole('radio', { name: 'PNG' }).first();
  const isPngVisible = await pngFormatOption.isVisible();

  if (isPngVisible) {
    // If PNG radio is visible, it might already be selected or we need to click it.
    // Let's check if it's checked. If not, click it.
    const isPngChecked = await pngFormatOption.isChecked();
    if (!isPngChecked) {
      await pngFormatOption.click();
    }
  } else {
    // Fallback: Try to find a select element for format and select PNG
    const formatSelect = page.getByRole('combobox', { name: /Format/ }).first();
    if (await formatSelect.isVisible()) {
      await formatSelect.selectOption('png');
    } else {
      // Last resort: Try to find any element with "PNG" and click it if it's a radio or option
      const pngElement = page.getByText('PNG').first();
      // This is risky, but if no better locator is found, we try.
      // However, the prompt says to prefer getByRole. Let's assume the radio button approach is correct
      // or that the format is a select. If neither works, the test might fail, but we've tried standard locators.
      // Let's re-evaluate. A common pattern is a select for format.
      // Let's try to find a select with "Format" in its label.
      const formatSelectFallback = page.getByRole('combobox', { name: 'Format' }).first();
      if (await formatSelectFallback.isVisible()) {
        await formatSelectFallback.selectOption('png');
      } else {
        // If all else fails, we might need to look for a specific test id or text.
        // But let's stick to the most likely scenario: a radio button or a select.
        // Let's assume the radio button is the primary way.
        // If the radio button wasn't visible, maybe the label is different.
        // Let's try to find any radio button in the dialog and check its name.
        const radios = page.getByRole('radio');
        const radioCount = await radios.count();
        for (let i = 0; i < radioCount; i++) {
          const name = await radios.nth(i).getAttribute('aria-label');
          if (name && name.toLowerCase().includes('png')) {
            if (!(await radios.nth(i).isChecked())) {
              await radios.nth(i).click();
            }
            break;
          }
        }
      }
    }
  }

  // Step 4: Click the export/print button
  // The print/ export button is likely labeled "Print" or "Export" or "OK" within the dialog.
  const printButton = page.getByRole('button', { name: /Print|Export|OK/ }).first();
  await expect(printButton).toBeVisible();

  // Wait for the download to start before clicking
  const downloadPromise = page.waitForEvent('download');
  await printButton.click();

  // Assert that a download occurred
  const download = await downloadPromise;
  const suggestedFilename = download.suggestedFilename();
  expect(suggestedFilename).toMatch(/\.png$/i);
});
