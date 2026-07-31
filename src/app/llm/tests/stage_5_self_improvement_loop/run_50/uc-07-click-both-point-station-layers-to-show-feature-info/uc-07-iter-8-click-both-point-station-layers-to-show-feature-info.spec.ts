// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Precondition: info panel is visible (already visible on initial load)
  await expect(page.getByTestId('info-panel')).toBeVisible();

  // Step 1: Click at map coordinates [1188692.84, 6767643.28] (EPSG:3857) on the map canvas.
  // The map container is an HTML element wrapping the OpenLayers canvas; we click the container
  // at the pixel position corresponding to the given map coordinates.
  const mapContainer = page.getByTestId('map-container');
  await mapContainer.click({
    force: true,
    position: { x: 1188692.84, y: 6767643.28 },
  });

  // Step 2: Wait for the info panel to load the station info for both layers.
  // Expected results:
  // - The info panel displays a 'UV-Index Station' section with feature information.
  // - The info panel displays an 'EUCOS Ground Station' section with feature information.
  await expect.poll(async () => {
    const infoPanel = page.getByTestId('info-panel');
    const uviHeading = infoPanel.getByRole('heading', { name: 'UV-Index Station', exact: true });
    const eucosHeading = infoPanel.getByRole('heading', { name: 'EUCOS Ground Station', exact: true });
    const uviVisible = await uviHeading.isVisible();
    const eucosVisible = await eucosHeading.isVisible();
    return { uviVisible, eucosVisible };
  }).toEqual({ uviVisible: true, eucosVisible: true });
});
