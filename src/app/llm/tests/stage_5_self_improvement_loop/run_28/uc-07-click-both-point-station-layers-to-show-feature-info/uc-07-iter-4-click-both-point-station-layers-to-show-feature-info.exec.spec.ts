// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { isLayerRendered, getMapCenter } from '../../../../map-model-helpers';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Precondition: Ensure info panel is visible
    await expect(page.getByTestId('info-panel')).toBeVisible();

    // Precondition: Ensure both layers are active
    await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

    // Precondition: Ensure measurement tool is not active
    const measurementToggle = page.getByTestId('measurement-toggle');
    if (await measurementToggle.getAttribute('aria-pressed') === 'true') {
        await measurementToggle.click({ force: true });
    }

    // Precondition: Pan the map so that the target coordinates are within the current viewport.
    const targetX = 1188692.84;
    const targetY = 6767643.28;

    await page.evaluate(
        ({ tx, ty }) => {
            const map = (globalThis as { __openPioneerMap?: { olMap?: { getView: () => { setCenter: (c: [number, number]) => void } } } }).__openPioneerMap;
            if (map?.olMap?.getView) {
                map.olMap.getView().setCenter([tx, ty]);
            }
        },
        { tx: targetX, ty: targetY },
    );

    // Wait for the map to finish panning
    await expect.poll(() => getMapCenter(page)).toEqual([targetX, targetY]);

    // Step 1: Click at the specified coordinates on the map canvas
    // The map is an OpenLayers canvas inside the map-container. We click directly
    // on the map container using the map projection coordinates.
    const mapContainer = page.getByTestId('map-container');
    await mapContainer.click({
        position: { x: targetX, y: targetY },
    });

    // Step 2: Wait for the info panel to load feature info for both layers
    // Expected results: Info panel displays sections for both station types
    await expect(page.getByRole('heading', { name: 'UV-Index Station', level: 2 })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'EUCOS Ground Station', level: 2 })).toBeVisible();
});
