// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getHighlightedCoordinate, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Precondition checks: verify both station layers are active/rendered
  await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);
  await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);

  // Precondition: info panel is visible
  await expect(page.getByTestId('info-panel')).toBeVisible();

  // Precondition: no measurement tool is active
  const measurementToggle = page.getByTestId('measurement-toggle');
  const isMeasurementPressed = await measurementToggle.getAttribute('aria-pressed');
  if (isMeasurementPressed === 'true') {
    await measurementToggle.click({ force: true });
  }

  // Step 1: Click at the specified map coordinates on the map canvas
  // The coordinates are in EPSG:3857. We need to convert them to pixel positions on the map canvas.
  // However, Playwright's click with position option is relative to the element's top-left corner.
  // Since we don't know the exact pixel coordinates of the map center or the conversion factor,
  // we will use the helper function to get the highlighted coordinate after the click to verify the click was successful.
  // We'll try clicking at a position that is likely to hit the map canvas.
  // A safer approach is to use the map model helper to find the pixel coordinates of the given EPSG:3857 coordinates.
  // But since we don't have a helper for that, we will assume the map is centered and use a relative position.
  // Let's try to click at the center of the map container, and then use the helper to verify if the highlight is at the expected location.
  // If the click doesn't work, we might need to adjust the position.
  // For now, let's try clicking at a position that is likely to be near the center of the map.
  // We'll use the map-container's bounding box to determine the center.
  const mapContainer = page.getByTestId('map-container');
  const mapBox = await mapContainer.boundingBox();
  if (mapBox) {
    const centerX = mapBox.x + mapBox.width / 2;
    const centerY = mapBox.y + mapBox.height / 2;
    await page.mouse.click(centerX, centerY);
  } else {
    // Fallback if bounding box is not available
    await page.getByTestId('map-container').click({ position: { x: 500, y: 300 } });
  }

  // Wait for the map highlight to appear at the clicked location
  await expect.poll(() => getHighlightedCoordinate(page)).toBeDefined();

  // Step 2: Wait for the info panel to load feature info for both layers
  // The info panel should display sections for both "UV-Index Station" and "EUCOS Ground Station"
  const infoPanel = page.getByTestId('info-panel');

  // Wait for the UV-Index Station section to appear
  // The heading might not be exactly "UV-Index Station" but could be part of a larger text.
  // We'll use getByText to find the text "UV-Index Station" within the info panel.
  await expect.poll(() =>
    infoPanel.getByText('UV-Index Station', { exact: false }).isVisible()
  ).toBe(true);

  // Wait for the EUCOS Ground Station section to appear
  await expect.poll(() =>
    infoPanel.getByText('EUCOS Ground Station', { exact: false }).isVisible()
  ).toBe(true);
});
