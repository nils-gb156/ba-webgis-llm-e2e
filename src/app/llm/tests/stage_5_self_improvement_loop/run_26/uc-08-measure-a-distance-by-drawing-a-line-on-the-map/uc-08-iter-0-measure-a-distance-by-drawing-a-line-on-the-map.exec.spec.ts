// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getMapCenter, getMapZoomLevel } from "../../../../map-model-helpers";

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Step 1: Activate the measurement tool
  const measurementToggle = page.getByTestId('measurement-toggle');
  await measurementToggle.click();

  // Verify the measurement panel is visible
  const measurementPanel = page.getByRole('dialog', { name: 'Measurement' });
  await expect(measurementPanel).toBeVisible();

  // Step 2: Click several points on the map canvas to draw a line
  // First, determine the map center and zoom to calculate click positions
  const center = await expect.poll(() => getMapCenter(page)).toBeDefined();
  const zoom = await expect.poll(() => getMapZoomLevel(page)).toBeDefined();

  // Calculate offsets in pixels to click distinct points on the map
  // We use the map container's bounding box and calculate pixel offsets from the center
  const mapContainer = page.getByTestId('map-container');
  const mapBox = await mapContainer.boundingBox();

  if (!mapBox) {
    throw new Error('Map container not found');
  }

  // Helper to convert map coordinates (EPSG:3857) to pixel coordinates
  const getPixelFromCenter = async (offsetX: number, offsetY: number) => {
    const pixel = await page.evaluate(
      ({ mapBox, centerX, centerY, offsetX, offsetY }) => {
        const map = (globalThis as { __openPioneerMap?: { olMap: { getPixelFromCoordinate: (coord: number[]) => number[] } } }).__openPioneerMap;
        if (!map) return null;
        const center = map.olMap.getView().getCenter();
        if (!center) return null;
        const pixelCenter = map.olMap.getPixelFromCoordinate(center);
        return {
          x: pixelCenter[0] + offsetX - mapBox.x - mapBox.width / 2,
          y: pixelCenter[1] + offsetY - mapBox.y - mapBox.height / 2,
        };
      },
      { mapBox, centerX: center[0], centerY: center[1], offsetX, offsetY }
    );

    if (!pixel) {
      throw new Error('Could not calculate pixel position');
    }

    return {
      x: Math.round(mapBox.x + mapBox.width / 2 + pixel.x - center[0]),
      y: Math.round(mapBox.y + mapBox.height / 2 + pixel.y - center[1]),
    };
  };

  // Click 3 points to form a simple line
  const point1 = await getPixelFromCenter(50, 50);
  const point2 = await getPixelFromCenter(150, 50);
  const point3 = await getPixelFromCenter(150, 150);

  await page.mouse.click(point1.x, point1.y);
  await page.mouse.click(point2.x, point2.y);
  await page.mouse.click(point3.x, point3.y);

  // Step 3: Double-click to finish the measurement
  await page.mouse.dblclick(point3.x, point3.y);

  // Expected results: The measurement panel displays a length value with a unit
  // The panel should still be visible and contain a length measurement
  await expect(measurementPanel).toBeVisible();

  // Look for a length value with a unit (e.g., "1.23 km" or "1234.56 m")
  const lengthText = measurementPanel.getByText(/^[0-9]+(\.[0-9]+)?\s+(km|m|mi|ft)$/);
  await expect(lengthText).toBeVisible();
});
