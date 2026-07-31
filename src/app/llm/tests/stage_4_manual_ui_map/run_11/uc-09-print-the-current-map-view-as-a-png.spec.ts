// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../map-model-helpers';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map and default layers to be ready
  await expect(page.getByTestId('map-container')).toBeVisible();
  await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);

  // Step 1: The user clicks the 'Print Map' button in the toolbar to open the printing panel.
  const printToggle = page.getByTestId('print-toggle');
  // Ensure the toggle is in the "off" state before clicking to open the panel.
  // If it's already pressed, clicking it would close the panel.
  if ((await printToggle.getAttribute('aria-pressed')) === 'true') {
    await printToggle.click({ force: true });
  }
  await printToggle.click({ force: true });

  // Verify the printing panel is visible
  await expect(page.getByTestId('printing-panel')).toBeVisible();

  // Step 2: The user enters a title for the printout.
  // The printing panel contains a text input for the title.
  // We look for an input within the printing panel.
  const titleInput = page.getByTestId('printing-panel').getByRole('textbox', { name: /title/i });
  await titleInput.fill('Test Printout');

  // Step 3: The user selects the PNG file format.
  // We look for a radio group or select for the format.
  const formatSelect = page.getByTestId('printing-panel').getByRole('combobox', { name: /format/i })
    .or(page.getByTestId('printing-panel').getByRole('radio', { name: 'PNG' }));

  if (await formatSelect.isVisible()) {
    if (await formatSelect.getAttribute('role') === 'combobox') {
      await formatSelect.selectOption('png');
    } else {
      // It's a radio button
      await formatSelect.click({ force: true });
    }
  } else {
    // Fallback: try to find any input or select that might control the format
    // Assuming standard labels or test ids might exist, but based on context, we try common roles.
    // If no specific locator is obvious, we might need to inspect the panel content.
    // Let's assume there's a select or radio. If not, we might need to use getByText.
    // Given the UI map doesn't specify internal elements of printing-panel, we rely on accessibility.
    // Let's try to find a button or link that says "PNG" or similar if the above fails.
    const pngButton = page.getByTestId('printing-panel').getByRole('button', { name: 'PNG' });
    if (await pngButton.isVisible()) {
      await pngButton.click();
    } else {
      // Last resort: assume the first select is the format
      const selects = page.getByTestId('printing-panel').getByRole('combobox');
      if (await selects.count() > 0) {
        await selects.first().selectOption('png');
      }
    }
  }

  // Step 4: The user clicks the export/print button.
  // We look for a button inside the printing panel that triggers the download.
  const exportButton = page.getByTestId('printing-panel').getByRole('button', { name: /export|print|download/i, exact: true })
    .or(page.getByTestId('printing-panel').getByRole('button', { name: /print/i }));

  // Wait for the download to start before clicking
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    exportButton.click()
  ]);

  // Verify the download happened
  expect(download.suggestedFilename()).toMatch(/\.png$/);

  // Verify the printing panel is still visible (or closed, depending on implementation, but usually stays open)
  // The prompt says "printing panel is visible" as an expected result, implying it stays open or was opened.
  await expect(page.getByTestId('printing-panel')).toBeVisible();
});
