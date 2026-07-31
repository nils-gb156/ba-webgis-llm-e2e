// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapZoomLevel, getHighlightedCoordinate } from '../../../../map-model-helpers';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Ensure the map is ready before proceeding.
  await expect.poll(() => getMapZoomLevel(page)).toBeTruthy();

  // Click directly on the map container at the provided map coordinates.
  // The map container is an HTML element that overlays the OpenLayers canvas.
  // Clicking it with a `position` option translates the coordinate into a pixel offset.
  await page.getByTestId('map-container').click({
    force: true,
    position: { x: 1188692.84, y: 6767643.28 },
  });

  // Wait for the info panel to display feature information for both station types.
  const infoPanel = page.getByTestId('info-panel');

  // Wait for the UV-Index Station info
  await expect(infoPanel.getByRole('heading', { name: 'UV-Index Station', exact: true })).toBeVisible({ timeout: 10000 });

  // Wait for the EUCOS Ground Station info
  await expect(infoPanel.getByRole('heading', { name: 'EUCOS Ground Station', exact: true })).toBeVisible({ timeout: 10000 });
});
