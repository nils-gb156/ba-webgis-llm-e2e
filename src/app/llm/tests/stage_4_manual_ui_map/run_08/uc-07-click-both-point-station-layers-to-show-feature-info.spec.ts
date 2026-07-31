// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../map-model-helpers';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Verify preconditions: Map is ready and station layers are rendered
    await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

    // Step 1: Click on the map at the specific coordinates where both stations exist
    const mapContainer = page.getByTestId('map-container');
    await mapContainer.click({
        position: {
            x: 1188692.84,
            y: 6767643.28,
        },
    });

    // Step 2: Wait for the info panel to load feature info for both layers
    await expect.poll(() => page.getByTestId('uvi-station-info').isVisible()).toBe(true);
    await expect.poll(() => page.getByTestId('eucos-station-info').isVisible()).toBe(true);

    // Expected results: Verify the sections are visible in the info panel
    await expect(page.getByTestId('uvi-station-section')).toBeVisible();
    await expect(page.getByTestId('eucos-station-section')).toBeVisible();
});
