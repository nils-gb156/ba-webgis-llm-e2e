// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapZoomLevel, isLayerRendered } from '../../../map-model-helpers';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Ensure the map is ready and layers are rendered
  await expect.poll(() => getMapZoomLevel(page)).toBeDefined();
  await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);
  await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

  // Ensure measurement tool is not active (reset if necessary)
  const measurementToggle = page.getByTestId('measurement-toggle');
  const isMeasurementActive = await measurementToggle.evaluate((el) => el.getAttribute('aria-pressed') === 'true');
  if (isMeasurementActive) {
    await measurementToggle.click({ force: true });
  }

  // Click on the map at the specified coordinates where both stations are located
  const mapContainer = page.getByTestId('map-container');
  await mapContainer.click({
    position: { x: 400, y: 300 } // Approximate center click; the exact coordinate mapping is handled by OL
  });

  // The use case specifies coordinates [1188692.84, 6767643.28].
  // Playwright's click uses page coordinates. We need to convert map coordinates to page coordinates.
  // However, without knowing the exact viewport size and map center/zoom at the start,
  // we can try clicking generally and then checking the info panel.
  // A more robust way is to use the map's coordinate conversion if available, but here we rely on the UI.
  // Let's assume the click at a central point might not hit the specific feature.
  // We will use the map's evaluate function to click at the exact coordinate if possible,
  // or we can try to find the feature by hovering/clicking near the expected location.
  // Since we can't easily convert EPSG:3857 to page pixel without knowing the view state,
  // we will attempt to click the map and then verify the info panel content.
  // If the click doesn't hit the feature, the info panel won't update.
  // Let's try to click the map at a location that is likely to be near the feature.
  // The feature is at [1188692.84, 6767643.28]. This is in Germany (approx).
  // We will perform a click on the map container. If the feature is not hit, we might need to pan/zoom.
  // However, the prompt implies the feature is visible.
  // We will click the map and then wait for the info panel to update.

  // Alternative: Use page.evaluate to click at the specific coordinate
  await page.evaluate(() => {
    const map = (globalThis as { __openPioneerMap?: any }).__openPioneerMap;
    if (map) {
      const pixel = map.olMap.getPixelFromCoordinate([1188692.84, 6767643.28]);
      if (pixel) {
        const element = map.olMap.getTargetElement() as HTMLElement;
        const rect = element.getBoundingClientRect();
        element.dispatchEvent(new MouseEvent('pointerdown', {
          clientX: rect.left + pixel[0],
          clientY: rect.top + pixel[1],
          bubbles: true
        }));
        element.dispatchEvent(new MouseEvent('pointerup', {
          clientX: rect.left + pixel[0],
          clientY: rect.top + pixel[1],
          bubbles: true
        }));
        element.dispatchEvent(new MouseEvent('click', {
          clientX: rect.left + pixel[0],
          clientY: rect.top + pixel[1],
          bubbles: true
        }));
      }
    }
  });

  // Wait for the info panel to load the station info for both layers
  // The info panel is visible by default. We need to check for the presence of the sections.
  // We look for text or elements that indicate the presence of 'UV-Index Station' and 'EUCOS Ground Station' info.
  // The UI map doesn't specify exact test-ids for the info panel content sections, so we use getByText or getByRole.
  
  // Wait for UV-Index Station info to appear
  await expect.poll(async () => {
    const infoPanel = page.getByTestId('info-panel');
    const uvIndexText = await infoPanel.getByText('UV-Index Station').first().isVisible();
    return uvIndexText;
  }).toBe(true);

  // Wait for EUCOS Ground Station info to appear
  await expect.poll(async () => {
    const infoPanel = page.getByTestId('info-panel');
    const eucosText = await infoPanel.getByText('EUCOS Ground Station').first().isVisible();
    return eucosText;
  }).toBe(true);

  // Assert that the info panel displays a 'UV-Index Station' section with feature information
  const infoPanel = page.getByTestId('info-panel');
  await expect(infoPanel.getByText('UV-Index Station')).toBeVisible();
  
  // Assert that the info panel displays an 'EUCOS Ground Station' section with feature information
  await expect(infoPanel.getByText('EUCOS Ground Station')).toBeVisible();
});
