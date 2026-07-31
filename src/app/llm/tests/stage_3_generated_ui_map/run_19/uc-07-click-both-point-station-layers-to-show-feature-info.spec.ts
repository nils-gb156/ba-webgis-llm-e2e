// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapZoomLevel, isLayerRendered } from '../../../map-model-helpers';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Ensure map is ready and layers are rendered
    await expect.poll(() => getMapZoomLevel(page)).toBeDefined();
    await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

    // Ensure measurement tool is not active (it should be off by default, but let's be safe)
    const measurementToggle = page.getByTestId('measurement-toggle');
    if (await measurementToggle.getAttribute('aria-pressed') === 'true') {
        await measurementToggle.click();
    }

    // Click on the map at the specified coordinates
    // The coordinates are in EPSG:3857. We need to click on the map container.
    const mapContainer = page.getByTestId('map-container');
    // We need to convert EPSG:3857 coordinates to pixel coordinates on the canvas.
    // However, Playwright's click with position is relative to the element's bounding box.
    // Since we don't have a direct helper to convert EPSG:3857 to pixel, we will use the
    // map's center and zoom to estimate, or better, use the map model to get the center
    // and then calculate the offset.
    // But a simpler approach for this specific test case is to assume the map is centered
    // roughly on the area or use the getHighlightedCoordinate if we had a previous click.
    // Since we don't, let's try to click the center of the map first to see if it's close,
    // or use the map model to get the view center and calculate the offset.

    // Let's get the current map view center and zoom to calculate the pixel position
    const center = await page.evaluate(() => {
        const map = (globalThis as { __openPioneerMap?: any }).__openPioneerMap;
        if (!map) return null;
        const view = map.olMap.getView();
        const center = view.getCenter();
        const zoom = view.getZoom();
        const size = map.olMap.getSize();
        return { center, zoom, size };
    });

    if (!center) {
        throw new Error('Map is not ready');
    }

    // Convert EPSG:3857 coordinates to pixel coordinates relative to the map container
    const targetX = 1188692.84;
    const targetY = 6767643.28;

    const pixelCoords = await page.evaluate(({ targetX, targetY, center, zoom, size }) => {
        const map = (globalThis as { __openPioneerMap?: any }).__openPioneerMap;
        if (!map) return null;
        const view = map.olMap.getView();
        const pixel = view.getPixelFromCoordinate([targetX, targetY]);
        const mapSize = map.olMap.getSize();
        if (!mapSize) return null;
        // Calculate offset from the top-left of the map container
        const offsetX = pixel[0] - mapSize[0] / 2;
        const offsetY = pixel[1] - mapSize[1] / 2;
        return { offsetX, offsetY, mapSize };
    }, { targetX, targetY, center, zoom, size: center.size });

    if (!pixelCoords) {
        throw new Error('Could not calculate pixel coordinates');
    }

    // Click the map container with the calculated offset
    await mapContainer.click({
        position: {
            x: pixelCoords.offsetX + pixelCoords.mapSize[0] / 2,
            y: pixelCoords.offsetY + pixelCoords.mapSize[1] / 2
        }
    });

    // Wait for the info panel to load feature info
    // The info panel is visible by default, so we just need to wait for the content to appear
    // We expect to see sections for both UV-Index Station and EUCOS Ground Station

    // Wait for the info panel to contain the UV-Index Station section
    // Since we don't have specific test ids for the section headers, we'll look for text
    await expect.poll(async () => {
        const infoPanel = page.getByTestId('info-panel');
        const text = await infoPanel.textContent();
        return text?.includes('UV-Index Station');
    }).toBe(true);

    // Wait for the info panel to contain the EUCOS Ground Station section
    await expect.poll(async () => {
        const infoPanel = page.getByTestId('info-panel');
        const text = await infoPanel.textContent();
        return text?.includes('EUCOS Ground Station');
    }).toBe(true);
});
