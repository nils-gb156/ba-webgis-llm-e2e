// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapZoomLevel, isLayerRendered } from '../../../map-model-helpers';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Ensure info panel is visible (it is visible by default)
    await expect(page.getByTestId('info-panel')).toBeVisible();

    // Ensure UV-Index Stations layer is rendered (active)
    await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);

    // Ensure EUCOS Ground Stations layer is rendered (active)
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

    // Ensure no measurement tool is active (toggle should be unpressed)
    const measurementToggle = page.getByTestId('measurement-toggle');
    const isMeasurementActive = await measurementToggle.getAttribute('aria-pressed');
    if (isMeasurementActive === 'true') {
        await measurementToggle.click({ force: true });
    }

    // Click on the map at the specified coordinates where both stations are located
    const mapContainer = page.getByTestId('map-container');
    await mapContainer.click({
        position: { x: 0, y: 0 },
        force: true,
        clickCount: 1
    });

    // Since we are clicking on a canvas, we need to simulate the click at the specific
    // coordinate relative to the map container. However, Playwright's click with position
    // is relative to the element's top-left. We need to calculate the offset or use
    // a more robust method. Given the complexity, we will assume the map is centered
    // or we can click near the center if the coordinates are central.
    // For precise coordinate clicking on a canvas in Playwright, we often need to
    // calculate the pixel offset from the map center.
    // Let's try clicking at a specific position. If the map is large enough, we can
    // approximate. A better way is to use page.mouse.move and page.mouse.click with
    // coordinates relative to the viewport, but we need the map's position.
    // Let's get the map container's bounding box to calculate the click position.
    const box = await mapContainer.boundingBox();
    if (!box) {
        throw new Error('Map container not found or not visible');
    }

    // The coordinates are in EPSG:3857. We need to convert them to pixel coordinates
    // on the map. This is complex without the map model's projection utilities.
    // However, the prompt provides helper functions. Let's use the map model to get
    // the center and zoom, and then calculate the offset.
    // Actually, a simpler approach for E2E tests when exact pixel mapping is hard is
    // to use the map model's coordinate to pixel conversion if available, or just
    // click at a known location if the test data is static.
    // Since the prompt says "Click at map coordinates...", and we have the map model,
    // let's use page.evaluate to perform the click or get the pixel position.
    // But Playwright's click is DOM-based.
    // Let's assume the map container is the reference. We can use the map model to
    // convert EPSG:3857 to pixel coordinates relative to the map container.
    // We will use page.evaluate to get the pixel coordinates of the given EPSG:3857
    // point relative to the map container's top-left corner.

    const pixelPosition = await page.evaluate(
        ([x, y, containerBox]) => {
            const map = (globalThis as { __openPioneerMap?: any }).__openPioneerMap;
            if (!map) return null;
            // OpenLayers uses ol.proj.fromLonLat or similar, but here we have EPSG:3857 directly.
            // The map's view center and zoom are needed.
            const view = map.olMap.getView();
            const center = view.getCenter();
            const zoom = view.getZoom();
            const resolution = view.getResolutionForZoom(zoom);

            // Calculate pixel offset from center
            const deltaX = x - center[0];
            const deltaY = center[1] - y; // Y is inverted in pixel coordinates

            const pixelX = deltaX / resolution + containerBox.width / 2;
            const pixelY = deltaY / resolution + containerBox.height / 2;

            return { x: pixelX, y: pixelY };
        },
        [1188692.84, 6767643.28, box]
    );

    if (!pixelPosition) {
        throw new Error('Could not calculate pixel position for click');
    }

    // Click at the calculated pixel position within the map container
    await mapContainer.click({
        position: {
            x: pixelPosition.x,
            y: pixelPosition.y
        }
    });

    // Wait for the info panel to update with feature info
    // The info panel is visible by default. We need to check if it contains the expected sections.
    // We will wait for the info panel to contain text related to 'UV-Index Station' and 'EUCOS Ground Station'.
    // Since the info panel content is dynamic, we use expect.poll.

    // Check for UV-Index Station info
    await expect.poll(() => page.getByTestId('info-panel').locator('text=UV-Index Station').count()).toBeGreaterThan(0);

    // Check for EUCOS Ground Station info
    await expect.poll(() => page.getByTestId('info-panel').locator('text=EUCOS Ground Station').count()).toBeGreaterThan(0);
});
