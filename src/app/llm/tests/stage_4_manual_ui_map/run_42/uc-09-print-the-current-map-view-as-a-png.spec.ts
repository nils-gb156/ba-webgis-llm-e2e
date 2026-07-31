// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle, isLayerRendered } from '../../../map-model-helpers';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Precondition: Ensure base map and overlays are visible
  await expect.poll(() => getActiveBaseLayerTitle(page)).toBeTruthy();
  await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);

  // Step 1: Open the printing panel
  const printToggle = page.getByTestId('print-toggle');
  // Check current state to avoid toggling it off if already open (though defaults say false)
  const isPrintOpen = await printToggle.getAttribute('aria-pressed');
  if (isPrintOpen !== 'true') {
    await printToggle.click();
  }

  // Verify printing panel is visible
  await expect(page.getByTestId('printing')).toBeVisible();

  // Step 2: Enter a title
  // Assuming the printing panel contains an input for the title.
  // Based on typical UI patterns for such panels, we look for a text input or label.
  // Since no specific test id is given for the title input in the ui-map, we rely on role/label.
  // The ui-map shows `printing` panel with `printing` element. We need to find the input inside.
  // Often these are just generic inputs. Let's try to find a text input within the printing panel.
  const printingPanel = page.getByTestId('printing');
  const titleInput = printingPanel.getByRole('textbox', { name: /title/i }).first();
  if (titleInput) {
    await titleInput.fill('Test Printout');
  } else {
    // Fallback: maybe it's a label "Title"
    const titleLabel = printingPanel.getByText('Title');
    if (titleLabel) {
      const input = titleLabel.locator('..').locator('input[type="text"]');
      await input.fill('Test Printout');
    }
  }

  // Step 3: Select PNG format
  // Look for a radio group or dropdown for format selection.
  const formatRadio = printingPanel.getByRole('radio', { name: 'PNG' }).first();
  if (formatRadio) {
    const isChecked = await formatRadio.isChecked();
    if (!isChecked) {
      await formatRadio.click({ force: true });
    }
  } else {
    // Fallback: Dropdown
    const formatSelect = printingPanel.getByRole('combobox', { name: /format/i }).first();
    if (formatSelect) {
      await formatSelect.selectOption('PNG');
    }
  }

  // Step 4: Trigger export/print
  // Look for an export or print button inside the printing panel
  const exportButton = printingPanel.getByRole('button', { name: /export|print|generate/i }).first();
  if (exportButton) {
    // Wait for download before clicking
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      exportButton.click()
    ]);

    // Verify download happened
    expect(download.suggestedFilename()).toMatch(/\.png$/i);
  } else {
    // Fallback: Maybe the button is just "Print" or "Export" without context
    const genericButton = page.getByRole('button', { name: /print|export/i }).first();
    if (genericButton) {
       const [download] = await Promise.all([
        page.waitForEvent('download'),
        genericButton.click()
      ]);
      expect(download.suggestedFilename()).toMatch(/\.png$/i);
    }
  }
});
