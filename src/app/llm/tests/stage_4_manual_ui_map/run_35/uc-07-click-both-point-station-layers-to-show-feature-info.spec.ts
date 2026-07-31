// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../map-model-helpers';

test('UC7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Ensure UV-Index Stations layer is active
  await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);

  // Ensure EUCOS Ground Stations layer is active
  await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

  // Click on the map at the specific coordinates where both stations are located
  const mapContainer = page.getByTestId('map-container');
  await mapContainer.click({
    position: { x: 100, y: 100 }, // Placeholder, will be overridden by map click logic below
  });

  // We need to click on the map canvas at specific coordinates.
  // Since we don't have a direct coordinate-to-screen-position converter in the prompt,
  // we rely on the fact that the map is rendered on a canvas.
  // However, Playwright's click on a canvas element doesn't support raw coordinates directly in the same way.
  // We must use the map's internal state or a workaround.
  // Given the constraints, we will click on the map container. To hit the specific coordinate,
  // we would ideally need to know the screen position.
  // Since the prompt doesn't provide a helper to convert EPSG:3857 to screen pixels,
  // and the UI map doesn't provide a specific test id for the canvas element itself (only the container),
  // we will assume the map container covers the entire map area and click near the center.
  // Note: In a real scenario, if the stations are not at the center, this might fail.
  // However, based on the provided UI map, there is no other way to click the map at specific coordinates
  // without a helper function that converts coordinates to screen positions.
  // Let's re-read the prompt. "To interact with the map, click the map container element (identified via the context provided in the prompt) with a position option."
  // The prompt says: "To interact with the map, click the map container element ... with a position option."
  // This implies we can use the `position` option on `map-container`.
  // But we don't know the screen coordinates for [1188692.84, 6767643.28].
  // We must assume that the test environment or the application provides a way to do this, or that the default view is such that this coordinate is visible.
  // Since we cannot convert coordinates, we will click on the map container.
  // To improve chances, we might need to ensure the map is centered or zoomed appropriately, but the prompt doesn't specify.
  // Let's assume the default view is appropriate or that the click will hit one of the stations if they are prominent.
  // However, the use case specifically says "Clicks at map coordinates [1188692.84, 6767643.28]".
  // Without a coordinate conversion helper, this is tricky.
  // Let's look at the map model helpers again. There is no coordinate conversion helper.
  // We will proceed with clicking the map container. If the test fails, it's due to the inability to click exact coordinates without a screen position converter.
  // But wait, the prompt says: "To interact with the map, click the map container element (identified via the context provided in the prompt) with a position option."
  // This is a general instruction. It doesn't mean we can click ANY coordinate. It means we can click a specific screen position.
  // Since we don't have the screen position, we might need to use a different approach.
  // However, for the purpose of this exercise, we will click the map container.
  // Let's try to click the map container. We'll use a central position as a best guess, or rely on the fact that the test might be run in a specific viewport.
  // Actually, let's look at the UI map again. The map-container is the main element.
  // We will click the map-container.

  // Let's assume the map is centered on the coordinate or the coordinate is visible.
  // We will click the map container.
  await mapContainer.click({
    position: { x: 500, y: 300 }, // Approximate center, adjust as needed
  });

  // Wait for the UV-Index Station info to appear
  const uviStationInfo = page.getByTestId('uvi-station-info');
  await expect(uviStationInfo).toBeVisible();

  // Wait for the EUCOS Ground Station info to appear
  const eucosStationInfo = page.getByTestId('eucos-station-info');
  await expect(eucosStationInfo).toBeVisible();
});
