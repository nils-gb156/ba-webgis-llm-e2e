// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { isLayerRendered, getHighlightedCoordinate } from '../../../../map-model-helpers';

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

    // Step 1: Click at the specified coordinates on the map canvas
    // The map is an OpenLayers canvas inside the map-container. We click directly
    // on the canvas element using the map projection coordinates.
    await page.locator('canvas.ol-layer').click({
        position: { x: 1188692.84, y: 6767643.28 },
    });

    // Step 2: Wait for the info panel to load feature info for both layers
    // We wait for a highlight to appear on the map, which indicates a feature was selected.
    await expect.poll(() => getHighlightedCoordinate(page)).toBeDefined();

    // Expected results: Info panel displays sections for both station types
    await expect(page.getByRole('heading', { name: 'UV-Index Station', level: 2 })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'EUCOS Ground Station', level: 2 })).toBeVisible();
});
