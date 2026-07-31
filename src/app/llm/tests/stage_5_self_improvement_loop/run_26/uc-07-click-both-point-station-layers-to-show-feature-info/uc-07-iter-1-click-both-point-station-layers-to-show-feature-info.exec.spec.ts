// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Precondition: Ensure the UV-Index Stations layer is rendered on the map
    await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);

    // Precondition: Ensure the EUCOS Ground Stations layer is rendered on the map
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

    // Precondition: Ensure the info panel is visible
    await expect(page.getByTestId('info-panel')).toBeVisible();

    // Step 1: Click on the map at the specified coordinates
    // The map-container testid points to the div wrapping the canvas.
    await page.getByTestId('map-container').click({
        position: { x: 1188692.84, y: 6767643.28 },
    });

    // Step 2: Wait for the info panel to load the station info for both layers
    // The info panel should display sections for both UV-Index Station and EUCOS Ground Station
    await expect(page.getByRole('heading', { name: 'UV-Index Station' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'EUCOS Ground Station' })).toBeVisible();
});
