// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Ensure no measurement tool is active
    const measurementToggle = page.getByTestId('measurement-toggle');
    if (await measurementToggle.getAttribute('aria-pressed') === 'true') {
        await measurementToggle.click({ force: true });
    }

    // Ensure the info panel is visible (it should be by default)
    const infoPanelToggle = page.getByTestId('info-panel-toggle');
    const infoPanel = page.getByTestId('info-panel');
    if (await infoPanel.isVisible()) {
        // Info panel is already open; nothing to do
    } else {
        await infoPanelToggle.click({ force: true });
        await expect(infoPanel).toBeVisible();
    }

    // Click on the map at the specified coordinates
    // The map is rendered as a canvas inside the map-container.
    // We use the map container's bounding box to calculate the click position.
    const mapContainer = page.getByTestId('map-container');
    const mapBox = await mapContainer.boundingBox();
    if (!mapBox) {
        throw new Error('Map container not found or has no bounding box');
    }

    // The coordinates are in EPSG:3857. We need to convert them to pixel coordinates.
    // However, Playwright's click with position is relative to the element.
    // A simpler approach is to use page.mouse.move and page.mouse.click,
    // but we need to know the pixel coordinates.
    // Let's try to use the map's internal projection to pixel conversion.
    // But since we don't have direct access to the map object, we can try a different approach.
    // We can use the map's center and zoom to estimate, but that's complex.
    // Instead, let's use the fact that the map is interactive and we can click on it.
    // We'll use the map container's bounding box and the known coordinates to estimate the click position.
    // This is a bit hacky, but it's the best we can do without direct map access.

    // For now, let's assume the coordinates are within the visible area and use a relative position.
    // We'll use the map container's bounding box and the known coordinates to estimate the click position.
    // This is a bit hacky, but it's the best we can do without direct map access.

    // Let's try to use the map's internal projection to pixel conversion.
    // We can use the page.evaluate to get the pixel coordinates from the map.
    const pixelCoords = await page.evaluate(
        ([x, y, mapContainerId]) => {
            const map = (globalThis as { __openPioneerMap?: any }).__openPioneerMap;
            if (!map) {
                return null;
            }
            // Convert EPSG:3857 to pixel coordinates
            const pixel = map.olMap.getPixelFromCoordinate([x, y]);
            return pixel;
        },
        [1188692.84, 6767643.28]
    );

    if (!pixelCoords) {
        throw new Error('Could not get pixel coordinates from map');
    }

    // Click on the map at the calculated pixel coordinates
    await mapContainer.click({
        position: {
            x: pixelCoords[0],
            y: pixelCoords[1],
        },
    });

    // Wait for the info panel to load feature info for both layers
    await expect(page.getByRole('heading', { name: 'UV-Index Station', level: 2 })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'EUCOS Ground Station', level: 2 })).toBeVisible();
});
