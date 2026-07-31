// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered, getHighlightedCoordinate } from '../../../../map-model-helpers';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Wait for the map to be ready and the required layers to be rendered
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);

    // Ensure the info panel is open
    const infoPanel = page.getByTestId('info-panel');
    await expect(infoPanel).toBeVisible();

    // Ensure no measurement tool is active
    const measurementToggle = page.getByTestId('measurement-toggle');
    const measurementPressed = await measurementToggle.getAttribute('aria-pressed');
    if (measurementPressed === 'true') {
        await measurementToggle.click();
    }

    // Click on the map at the specified coordinates
    // The map canvas is rendered by OpenLayers and must be clicked directly.
    // Coordinates [1188692.84, 6767643.28] are in EPSG:3857.
    const mapContainer = page.getByTestId('map-container');
    const box = await mapContainer.boundingBox();
    if (!box) {
        throw new Error('Map container not found');
    }

    // Use the map model to convert EPSG:3857 coordinates to pixel coordinates
    const pixelCoords = await page.evaluate(
        async ({ x, y, box }) => {
            const map = (globalThis as { __openPioneerMap?: { olMap: { getPixelFromCoordinate: (coord: [number, number]) => [number, number] } } }).__openPioneerMap;
            if (!map) return null;
            const pixel = map.olMap.getPixelFromCoordinate([x, y]);
            // Return pixel coordinates relative to the map container's top-left
            return [pixel[0] + box.x, pixel[1] + box.y];
        },
        { x: 1188692.84, y: 6767643.28, box }
    );

    if (!pixelCoords) {
        throw new Error('Map model not available or coordinate conversion failed');
    }

    // Click on the map at the calculated pixel position
    await page.mouse.click(pixelCoords[0], pixelCoords[1]);

    // Wait for the info panel to load the station info for both layers
    // The info panel should display headings for both station types
    await expect.poll(() => infoPanel.getByText('UV-Index Station').isVisible()).toBe(true);
    await expect.poll(() => infoPanel.getByText('EUCOS Ground Station').isVisible()).toBe(true);

    // Verify that the info panel displays a 'UV-Index Station' section
    await expect(infoPanel.getByText('UV-Index Station')).toBeVisible();

    // Verify that the info panel displays an 'EUCOS Ground Station' section
    await expect(infoPanel.getByText('EUCOS Ground Station')).toBeVisible();
});
