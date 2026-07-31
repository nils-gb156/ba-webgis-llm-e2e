// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../map-model-helpers';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Precondition: Ensure map is ready and layers are visible
  await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);

  // Step 1: Open the printing panel
  const printToggle = page.getByTestId('print-toggle');
  const printPanel = page.getByTestId('printing-panel');

  // Check current state of the toggle to avoid closing it if already open
  const isPrintActive = await printToggle.getAttribute('aria-pressed');
  if (isPrintActive !== 'true') {
    await printToggle.click();
  }

  // Verify the printing panel is visible
  await expect(printPanel).toBeVisible();

  // Step 2: Enter a title for the printout
  const titleInput = page.getByTestId('printing').getByLabel('Title');
  await titleInput.fill('Test Printout');

  // Step 3: Select the PNG file format
  const formatSelect = page.getByTestId('printing').getByLabel('Format');
  await formatSelect.selectOption('png');

  // Step 4: Trigger the export
  // Wait for the download to start before clicking
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByTestId('printing').getByRole('button', { name: /Export|Print|Generate/i }).click()
  ]);

  // Assert on the download
  const suggestedFilename = download.suggestedFilename();
  expect(suggestedFilename).toMatch(/\.png$/);
});
