// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../../map-model-helpers';

test('UC7: Click both point station layers to show feature info', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Precondition: Ensure both station layers are rendered and the info panel is visible.
    await expect(page.getByTestId('info-panel')).toBeVisible();
    await expect(page.getByRole('checkbox', { name: 'EUCOS Ground Stations' })).toBeChecked();
    await expect(page.getByRole('checkbox', { name: 'UV-Index Stations' })).toBeChecked();

    // Wait for the layers to be rendered on the map before clicking.
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);

    // Step 1: Click at the specified map coordinates [1188692.84, 6767643.28] (EPSG:3857).
    // The map-container is the canvas. We click directly on it using the coordinate helper.
    await page.getByTestId('map-container').click({
        position: { x: 1188692.84, y: 6767643.28 },
        force: true,
    });

    // Step 2: Wait for the info panel to load the station info for both layers.
    // Expected results: Info panel displays 'UV-Index Station' and 'EUCOS Ground Station' sections.
    await expect(page.getByRole('heading', { name: 'UV-Index Station' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'EUCOS Ground Station' })).toBeVisible();
});
