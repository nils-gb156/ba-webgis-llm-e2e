// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getMapCenter, isLayerRendered } from '../../../../map-model-helpers';

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

    // Precondition: Pan the map so that the target coordinates [1188692.84, 6767643.28]
    // are within the current viewport.  The initial extent may not include this
    // location, so we zoom in first (which moves the map) and then pan to the
    // exact coordinates.
    await page.getByTestId('zoom-in-button').click();
    await page.getByTestId('zoom-in-button').click();
    await page.getByTestId('zoom-in-button').click();

    // Now pan the map so that the target coordinate is roughly in the center.
    // Clicking the map at the target coordinate will also work, but we need the
    // map to be visible first.  We use the map-center helper to check if the
    // target is in view.  If not, we pan to it.
    const targetX = 1188692.84;
    const targetY = 6767643.28;

    // Pan the map to the target coordinate by clicking the map at that position.
    // We use a small offset to avoid any edge cases with the map container.
    const mapContainer = page.getByTestId('map-container');

    // First, try to click directly at the target coordinates.  If the map is not
    // panned to that location, the click will still register but we want to make
    // sure the map is visible.  We'll pan to the target first.
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
    await page.waitForTimeout(500);

    // Step 1: Click at the specified coordinates on the map canvas
    // The map is an OpenLayers canvas inside the map-container. We click directly
    // on the map container using the map projection coordinates.
    await mapContainer.click({
        position: { x: targetX, y: targetY },
    });

    // Step 2: Wait for the info panel to load feature info for both layers
    // Expected results: Info panel displays sections for both station types
    await expect(page.getByRole('heading', { name: 'UV-Index Station', level: 2 })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'EUCOS Ground Station', level: 2 })).toBeVisible();
});
