// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '../../../failure-snapshot-fixture';
import { isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Ensure measurement tool is not active (it is initially off, but be explicit)
  const measurementToggle = page.getByTestId('measurement-toggle');
  const measurementIsPressed = await measurementToggle.getAttribute('aria-pressed');
  if (measurementIsPressed === 'true') {
    await measurementToggle.click();
  }

  // Ensure the UV-Index Stations layer is active (it should be, but verify)
  await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);

  // Ensure the EUCOS Ground Stations layer is active (it should be, but verify)
  await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

  // 1. Click on the map at the specified coordinates
  await page.locator('[data-testid="map-container"]').click({
    position: { x: 1188692.84, y: 6767643.28 },
  });

  // 2. Wait for the info panel to load the station info for both layers
  // The info panel is already visible, so we just wait for the content to appear
  await expect(page.getByRole('heading', { name: 'UV-Index Station' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'EUCOS Ground Station' })).toBeVisible();
});
