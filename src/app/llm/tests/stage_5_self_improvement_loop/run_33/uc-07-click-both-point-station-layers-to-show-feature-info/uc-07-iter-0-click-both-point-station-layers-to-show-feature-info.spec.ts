// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';
import { getHighlightedCoordinate } from '../../../../map-model-helpers';

test('UC7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Preconditions:
  // - Info panel is visible (already pressed in the initial state)
  // - UV-Index Stations layer is active (checked)
  // - EUCOS Ground Stations layer is active (checked)
  // - No measurement tool is active (not pressed)

  // Step 1: Click at map coordinates [1188692.84, 6767643.28] (EPSG:3857) on the map canvas.
  await page.locator('#map-container').click({
    position: { x: 1188692.84, y: 6767643.28 },
  });

  // Step 2: Wait for the info panel to load the station info for both layers.
  // Verify that a highlight marker appears at the clicked coordinate.
  await expect.poll(() => getHighlightedCoordinate(page)).toEqual([1188692.84, 6767643.28]);

  // Expected results:
  // - The info panel displays a 'UV-Index Station' section with feature information.
  // - The info panel displays an 'EUCOS Ground Station' section with feature information.
  await expect(page.getByTestId('info-panel').getByText('UV-Index Station')).toBeVisible();
  await expect(page.getByTestId('info-panel').getByText('EUCOS Ground Station')).toBeVisible();
});
