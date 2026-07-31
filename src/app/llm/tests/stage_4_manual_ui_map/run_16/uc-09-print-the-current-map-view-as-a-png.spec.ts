// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle, isLayerRendered } from '../../../map-model-helpers';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Verify preconditions: Base map and at least one overlay are visible.
  await expect.poll(() => getActiveBaseLayerTitle(page)).toBeTruthy();
  await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);

  // 1. Open the printing panel.
  await page.getByTestId('print-toggle').click();
  await expect(page.getByTestId('printing-panel')).toBeVisible();

  // 2. Enter a title.
  // Scoping to the printing panel to avoid ambiguity if other inputs exist.
  const printingPanel = page.getByTestId('printing-panel');
  const titleInput = printingPanel.getByLabel('Title').or(printingPanel.getByTestId('printing-title-input'));
  
  // Fallback: try to find the title input by role if testid is not explicitly labeled 'Title'
  // Based on typical forms, it's likely a text input.
  const titleField = printingPanel.getByRole('textbox', { name: /title/i }).first();
  await titleField.fill('My Map Print');

  // 3. Select PNG format.
  // Assuming a radio group or dropdown for format.
  // Try radio buttons first.
  const pngRadio = printingPanel.getByRole('radio', { name: 'PNG' }).first();
  if (await pngRadio.isVisible()) {
    await pngRadio.check();
  } else {
    // Fallback to dropdown/select
    const formatSelect = printingPanel.getByRole('combobox', { name: /format/i }).first();
    await formatSelect.selectOption('PNG');
  }

  // 4. Trigger export.
  // Wait for download before clicking.
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    printingPanel.getByRole('button', { name: /export|print|download/i }).first().click()
  ]);

  // Verify download
  expect(download.suggestedFilename()).toMatch(/\.png$/);
});
