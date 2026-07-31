// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getHighlightedCoordinate } from '../../../../map-model-helpers';

test('UC7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Precondition: Info panel is visible (it is open by default)
  await expect(page.getByTestId('info-panel')).toBeVisible();

  // Precondition: UV-Index Stations layer is active
  await expect.poll(() => page.getByTestId('uvi-stations-legend').isVisible()).resolves.toBe(true);

  // Precondition: EUCOS Ground Stations layer is active
  await expect.poll(() => page.getByTestId('eucos-stations-legend').isVisible()).resolves.toBe(true);

  // Precondition: No measurement tool is active
  await expect(page.getByTestId('measurement-toggle')).not.toBeChecked();

  // Step 1: Click at map coordinates [1188692.84, 6767643.28] (EPSG:3857)
  await page.locator('[data-testid="map-container"]').click({
    position: { x: 400, y: 300 },
  });

  // Step 2: Wait for the info panel to load the station info for both layers
  // Use a high-level assertion on the info panel content.
  // The info panel should contain sections for both "UV-Index Station" and "EUCOS Ground Station".
  await expect.poll(() => page.getByTestId('info-panel').textContent()).resolves.toContain('UV-Index Station');
  await expect.poll(() => page.getByTestId('info-panel').textContent()).resolves.toContain('EUCOS Ground Station');

  // Verify that a highlight marker is shown on the map at the clicked location
  await expect.poll(() => getHighlightedCoordinate(page)).resolves.toEqual([1188692.84, 6767643.28]);
});
