// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('UC7: Click both point station layers to show feature info', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Precondition: Ensure both station layers are rendered and the info panel is visible.
    await expect(page.getByRole('checkbox', { name: 'EUCOS Ground Stations' })).toBeChecked();
    await expect(page.getByRole('checkbox', { name: 'UV-Index Stations' })).toBeChecked();
    await expect(page.getByTestId('info-panel')).toBeVisible();

    // Step 1: Click at the specified map coordinates [1188692.84, 6767643.28] (EPSG:3857).
    // The coordinates are in the map projection (EPSG:3857), not pixel coordinates.
    // We need to convert them to pixel coordinates to click on the canvas.
    // However, the map library (OpenLayers) provides a way to do this via the map model.
    // Since we don't have a direct helper to convert projection coords to pixel coords,
    // we can use the map model to get the viewport size and the projection to pixel transform.
    // But a simpler approach, given the context, is to use the map's coordinate system.
    // The map-container is the canvas. We need to click on it.
    // The coordinates [1188692.84, 6767643.28] are in EPSG:3857.
    // We need to find the pixel coordinates on the canvas for this map coordinate.
    // Let's use page.evaluate to get the pixel coordinates from the map model.
    const pixelCoords = await page.evaluate(
        ([x, y]) => {
            const map = (globalThis as { __openPioneerMap?: { olMap: { getPixelFromCoordinate: (arg0: number[]) => number[] } } }).__openPioneerMap;
            if (!map) return null;
            return map.olMap.getPixelFromCoordinate([x, y]);
        },
        [1188692.84, 6767643.28]
    );

    if (!pixelCoords) {
        throw new Error('Map model not available or coordinate conversion failed.');
    }

    // Step 2: Click on the map at the calculated pixel coordinates.
    await page.getByTestId('map-container').click({
        position: { x: pixelCoords[0], y: pixelCoords[1] },
    });

    // Step 3: Wait for the info panel to load the station info for both layers.
    // Expected results: Info panel displays 'UV-Index Station' and 'EUCOS Ground Station' sections.
    // The info panel content is dynamic, so we wait for the specific headings to appear.
    await expect(page.getByRole('heading', { name: 'UV-Index Station' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'EUCOS Ground Station' })).toBeVisible();
});
