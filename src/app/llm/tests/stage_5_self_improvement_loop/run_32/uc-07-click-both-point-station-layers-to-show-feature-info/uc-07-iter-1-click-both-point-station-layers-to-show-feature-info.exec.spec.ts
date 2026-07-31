// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Verify preconditions: info panel is visible, layers are active
    await expect(page.getByTestId('info-panel')).toBeVisible();
    await expect(page.getByTestId('eucos-stations-legend')).toBeVisible();
    await expect(page.getByTestId('uvi-stations-legend')).toBeVisible();

    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);

    // Ensure no measurement tool is active
    const measurementToggle = page.getByRole('button', { name: 'Measurement' });
    const isMeasurementActive = await measurementToggle.getAttribute('aria-pressed');
    if (isMeasurementActive === 'true') {
        await measurementToggle.click();
    }

    // Click on the map at the specified coordinates
    // The coordinates provided are in map projection (EPSG:3857), but the click position
    // option expects pixel coordinates relative to the element. We need to convert
    // EPSG:3857 coordinates to pixel coordinates on the map canvas.
    // We use page.evaluate to convert the coordinates using the map model.
    const mapContainer = page.getByTestId('map-container');
    
    // Get pixel coordinates from EPSG:3857 coordinates
    const pixelCoords = await page.evaluate(
        ([x, y]) => {
            const map = (globalThis as { __openPioneerMap?: { olMap: { getPixelFromCoordinate: (coord: number[]) => [number, number] } } }).__openPioneerMap;
            if (!map?.olMap) return null;
            return map.olMap.getPixelFromCoordinate([x, y]);
        },
        [1188692.84, 6767643.28]
    );

    if (pixelCoords) {
        await mapContainer.click({
            position: {
                x: pixelCoords[0],
                y: pixelCoords[1],
            },
        });
    } else {
        // Fallback: try clicking at a reasonable position if conversion fails
        // This should not happen in normal circumstances
        await mapContainer.click({
            position: {
                x: 500,
                y: 500,
            },
        });
    }

    // Wait for the info panel to load the station info for both layers
    await expect.poll(() => page.getByRole('heading', { name: 'UV-Index Station' }).isVisible()).toBe(true);
    await expect.poll(() => page.getByRole('heading', { name: 'EUCOS Ground Station' }).isVisible()).toBe(true);
});
