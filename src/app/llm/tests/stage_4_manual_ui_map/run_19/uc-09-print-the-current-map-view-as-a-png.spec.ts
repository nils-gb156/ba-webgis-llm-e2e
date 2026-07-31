// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapZoomLevel, isLayerRendered } from '../../../map-model-helpers';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for map to be ready and layers to be rendered
  await expect.poll(() => getMapZoomLevel(page)).toBeDefined();
  await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);

  // Step 1: Open the printing panel
  const printToggle = page.getByTestId('print-toggle');
  // Check current state to avoid toggling off if already open
  const isPrintOpen = await printToggle.getAttribute('aria-pressed');
  if (isPrintOpen !== 'true') {
    await printToggle.click({ force: true });
  }
  await expect(page.getByTestId('printing-panel')).toBeVisible();

  // Step 2: Enter a title
  // Assuming the printing panel contains a text input for the title.
  // Based on typical UI patterns and the test id 'printing', we look for an input inside it.
  const titleInput = page.getByTestId('printing').getByLabel(/Title/i);
  await titleInput.fill('Test Printout');

  // Step 3: Select PNG format
  // Assuming there is a radio group or dropdown for format selection.
  // We look for a radio button or option with 'PNG' text.
  const pngFormatOption = page.getByTestId('printing').getByRole('radio', { name: 'PNG', exact: true });
  if (await pngFormatOption.isChecked().catch(() => false)) {
    // Already selected
  } else {
    await pngFormatOption.click({ force: true });
  }

  // Step 4: Trigger export
  // Wait for the download event before clicking the export button
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByTestId('printing').getByRole('button', { name: /Export|Print/i }).click()
  ]);

  // Assert that a file was downloaded
  const suggestedFilename = download.suggestedFilename();
  expect(suggestedFilename).toMatch(/\.png$/i);
});
