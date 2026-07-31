// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../map-model-helpers';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Ensure UV-Index Stations and EUCOS Ground Stations layers are rendered
    await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

    // Click on the map at the specific coordinates where both stations are located
    const mapContainer = page.getByTestId('map-container');
    await mapContainer.click({
        position: {
            x: 1188692.84,
            y: 6767643.28
        }
    });

    // Wait for and assert that the UV-Index Station info section is visible
    await expect(page.getByTestId('uvi-station-info')).toBeVisible();

    // Wait for and assert that the EUCOS Ground Station info section is visible
    await expect(page.getByTestId('eucos-station-info')).toBeVisible();
});
