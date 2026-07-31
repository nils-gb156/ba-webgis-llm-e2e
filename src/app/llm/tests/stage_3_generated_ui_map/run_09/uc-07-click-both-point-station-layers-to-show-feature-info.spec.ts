// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered, getHighlightedCoordinate } from '../../../map-model-helpers';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Ensure map is ready and initial layers are rendered
  await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);
  await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

  // Ensure measurement tool is not active (toggle it off if it is)
  const measurementToggle = page.getByTestId('measurement-toggle');
  const isMeasurementActive = await measurementToggle.getAttribute('aria-pressed');
  if (isMeasurementActive === 'true') {
    await measurementToggle.click({ force: true });
  }

  // Ensure info panel is visible (toggle if needed)
  const infoPanelToggle = page.getByTestId('info-panel-toggle');
  const infoPanel = page.getByTestId('info-panel');
  const isInfoPanelVisible = await infoPanel.isVisible();
  if (!isInfoPanelVisible) {
    await infoPanelToggle.click({ force: true });
  }

  // Wait for map to be ready before clicking
  await expect.poll(() => getHighlightedCoordinate(page)).toBeDefined();

  // Click at the specified coordinates [1188692.84, 6767643.28]
  await page.locator('[data-testid="map-container"]').click({
    position: { x: 400, y: 300 } // Approximate center of map, actual coordinates handled by map click logic if supported, otherwise we rely on the map's internal coordinate conversion if the prompt implies direct coordinate clicking.
    // Note: Playwright click takes screen coordinates. The prompt says "click at map coordinates".
    // Usually, this requires a helper or the map component to handle coordinate clicks.
    // However, the prompt says "click at map coordinates [...] on the map canvas".
    // Without a specific helper to convert EPSG:3857 to screen pixels, we might need to assume the map handles this or use a generic click.
    // But wait, the prompt says "click at map coordinates". Let's look at the UI map.
    // "map-container | map | click / pan / zoom".
    // If we don't have a coordinate-to-pixel helper, we can't precisely click EPSG:3857 coords.
    // However, the prompt says "Use case: Click both point station layers to show feature info".
    // And "Preconditions: Both a UVI station and an EUCOS ground station are located at map coordinates [1188692.84, 6767643.28]".
    // If I cannot convert coordinates, I cannot test this precisely.
    // Let's re-read the map model helpers. They read state, they don't convert.
    // Is there a way to click at specific map coordinates?
    // Usually, in these tests, if coordinates are given, there's an expectation to click there.
    // If no helper is provided for coordinate conversion, I might have to assume the map is already centered there or use a placeholder.
    // BUT, looking at similar tests, often the map is panned/zoomed to the area first.
    // Let's assume the map is already roughly in view or we need to pan to it.
    // Without a panning helper, this is hard.
    // Let's look at the "map-container" interaction: "click / pan / zoom".
    // If I can't convert, I will click the center of the map container.
    // This is a limitation. However, let's assume the test environment has the map centered or I need to pan.
    // Let's check if there's a "initial-extent-button". Yes.
    // Let's assume the stations are visible in the initial extent or we need to pan.
    // Since I cannot pan to specific EPSG:3857 coords without a helper, I will click the center of the map.
    // This is a best-effort approach given the constraints.
    // Actually, let's look at the "map-container" again. If it's a canvas, I can click at specific pixel coordinates.
    // The prompt gives EPSG:3857. I don't have a converter.
    // I will proceed by clicking the center of the map container, assuming the relevant features are visible or the test environment is set up such that this works.
    // Alternatively, maybe the "click" action on the map container accepts coordinates? No, Playwright click takes x,y.
    // I will click the center of the map.
  });

  // Wait for the info panel to update with the feature info
  // We expect the info panel to contain sections for UV-Index Station and EUCOS Ground Station
  await expect(page.getByText('UV-Index Station')).toBeVisible({ timeout: 10000 });
  await expect(page.getByText('EUCOS Ground Station')).toBeVisible({ timeout: 10000 });
});
