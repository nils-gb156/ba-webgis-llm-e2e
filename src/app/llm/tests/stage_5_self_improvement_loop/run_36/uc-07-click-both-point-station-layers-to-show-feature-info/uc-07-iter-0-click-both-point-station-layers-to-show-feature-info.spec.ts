// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getHighlightedCoordinate } from '../../../../map-model-helpers';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Preconditions: Ensure measurement tool is not active
  const measurementToggle = page.getByTestId('measurement-toggle');
  if (await measurementToggle.getAttribute('aria-pressed') === 'true') {
    await measurementToggle.click();
  }

  // Ensure info panel is visible (it should be by default, but assert to be sure)
  await expect(page.getByRole('heading', { name: 'Information', exact: true })).toBeVisible();

  // Step 1: Click at the specified map coordinates
  const clickX = 1188692.84;
  const clickY = 6767643.28;
  await page.locator('[data-testid="map-container"]').click({
    position: { x: clickX, y: clickY },
  });

  // Step 2: Wait for the info panel to load the station info for both layers
  // We wait for the highlights to appear, indicating the map interaction completed
  await expect.poll(() => getHighlightedCoordinate(page)).toBeTruthy();

  // Expected results: Verify feature info sections are displayed
  await expect(page.getByRole('heading', { name: 'UV-Index Station' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'EUCOS Ground Station' })).toBeVisible();
});
