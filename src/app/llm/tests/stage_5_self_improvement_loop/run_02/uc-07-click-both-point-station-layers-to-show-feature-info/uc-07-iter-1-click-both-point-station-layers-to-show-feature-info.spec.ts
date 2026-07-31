// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapZoomLevel, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Verify preconditions: both station layers are rendered
    await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

    // Ensure the measurement tool is not active (precondition)
    const measurementToggle = page.getByRole('button', { name: 'Measurement' });
    const isMeasurementActive = await measurementToggle.getAttribute('aria-pressed');
    if (isMeasurementActive === 'true') {
        await measurementToggle.click();
    }

    // Click on the map at the specified coordinates.
    // The coordinates [1188692.84, 6767643.28] are in EPSG:3857 (map projection).
    // Playwright's `position` option expects pixel offsets from the top-left of the element.
    // We must convert the map coordinates to pixel coordinates using the map's view.
    const mapContainer = page.getByTestId('map-container');

    // Calculate pixel position from map coordinates
    const pixelPosition = await page.evaluate(({ mapContainerSelector, x, y }) => {
        const map = (globalThis as { __open PioneerMap?: { olMap?: { getView?: () => { getCenter: () => [number, number]; getZoom: () => number }; getPixelFromCoordinate: (coord: [number, number]) => [number, number] } } }).__openPioneerMap;
        if (!map?.olMap) return null;
        const view = map.olMap.getView();
        const center = view.getCenter();
        const zoom = view.getZoom();
        if (!center || zoom === undefined) return null;

        // Calculate scale factor relative to default zoom (typically 0 or 1 depending on OL config)
        // A more robust way: use getPixelFromCoordinate directly if available on OL map
        // Since we have access to olMap, we can use its getPixelFromCoordinate method
        const pixel = map.olMap.getPixelFromCoordinate([x, y]);
        return pixel;
    }, { mapContainerSelector: 'map-container', x: 1188692.84, y: 6767643.28 });

    if (pixelPosition) {
        await mapContainer.click({
            position: {
                x: pixelPosition[0],
                y: pixelPosition[1],
            },
        });
    } else {
        // Fallback: if map model is not ready, try clicking at a reasonable default position
        // This should ideally not happen if preconditions are met, but as a safeguard:
        await mapContainer.click({
            position: {
                x: 500,
                y: 300,
            },
        });
    }

    // Wait for and verify the info panel displays feature info for both layers
    const infoPanel = page.getByTestId('info-panel');
    await expect(infoPanel.getByRole('heading', { name: 'UV-Index Station', exact: true })).toBeVisible();
    await expect(infoPanel.getByRole('heading', { name: 'EUCOS Ground Station', exact: true })).toBeVisible();
});
