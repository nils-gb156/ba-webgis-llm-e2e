// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '../../../failure-snapshot-fixture';

test('UC7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Step 1: Click at map coordinates [1188692.84, 6767643.28] (EPSG:3857) on the map canvas.
  // The map canvas is an <canvas> element inside the map-container.
  // We target the canvas directly to avoid the intercepting overlay.
  await page.locator('canvas').click({
    position: { x: 1188692.84, y: 6767643.28 },
  });

  // Step 2: Wait for the info panel to load the station info for both layers.
  // Expected results:
  // - The info panel displays a 'UV-Index Station' section with feature information.
  // - The info panel displays an 'EUCOS Ground Station' section with feature information.
  await expect(page.getByTestId('info-panel').getByText('UV-Index Station')).toBeVisible();
  await expect(page.getByTestId('info-panel').getByText('EUCOS Ground Station')).toBeVisible();
});
