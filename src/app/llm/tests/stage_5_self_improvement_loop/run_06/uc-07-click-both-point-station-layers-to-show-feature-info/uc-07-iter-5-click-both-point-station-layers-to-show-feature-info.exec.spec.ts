// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Wait for the required layers to be rendered on the map
    const { isLayerRendered } = await import('../../../../map-model-helpers');
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);

    // Ensure the info panel is visible
    const infoPanel = page.getByTestId('info-panel');
    await expect(infoPanel).toBeVisible();

    // Ensure no measurement tool is active
    const measurementToggle = page.getByTestId('measurement-toggle');
    const measurementPressed = await measurementToggle.getAttribute('aria-pressed');
    if (measurementPressed === 'true') {
        await measurementToggle.click();
    }

    // Click on the map at the specified coordinates using the helper
    const { getMapCenter, getMapZoomLevel } = await import('../../../../map-model-helpers');
    const mapContainer = page.getByTestId('map-container');
    const box = await mapContainer.boundingBox();
    if (!box) {
        throw new Error('Map container not found');
    }

    const targetX = 1188692.84;
    const targetY = 6767643.28;

    const pixelCoords = await page.evaluate(
        ({ x, y, box }) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const map = (globalThis as { __openPioneerMap?: any }).__openPioneerMap;
            if (!map) return null;
            const pixel = map.olMap.getPixelFromCoordinate([x, y]);
            if (!pixel) return null;
            return [pixel[0] + box.x, pixel[1] + box.y];
        },
        { x: targetX, y: targetY, box }
    );

    if (!pixelCoords) {
        throw new Error('Map model not available or coordinate conversion failed');
    }

    // Click on the map at the calculated pixel position
    await page.mouse.click(pixelCoords[0], pixelCoords[1]);

    // Wait for the info panel to load the station info for both layers
    await expect.poll(() => infoPanel.getByText('UV-Index Station').isVisible()).toBe(true);
    await expect.poll(() => infoPanel.getByText('EUCOS Ground Station').isVisible()).toBe(true);

    // Verify that the info panel displays a 'UV-Index Station' section
    await expect(infoPanel.getByText('UV-Index Station')).toBeVisible();

    // Verify that the info panel displays an 'EUCOS Ground Station' section
    await expect(infoPanel.getByText('EUCOS Ground Station')).toBeVisible();
});
