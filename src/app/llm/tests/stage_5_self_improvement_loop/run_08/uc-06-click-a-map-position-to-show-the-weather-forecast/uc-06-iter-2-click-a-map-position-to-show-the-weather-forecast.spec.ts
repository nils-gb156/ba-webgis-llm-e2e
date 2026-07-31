// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getHighlightedCoordinate, isLayerRendered } from '../../../../map-model-helpers';

test('UC-6: Click a map position to show the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Precondition: Info panel is visible
    await expect(page.getByTestId('info-panel')).toBeVisible();

    // Precondition: Map canvas is interactive
    await expect(page.getByTestId('map-container')).toBeVisible();

    // Step 1: Click on a position on the map canvas.
    // We use the center of the map container to ensure a valid click.
    const mapBox = await page.getByTestId('map-container').boundingBox();
    if (!mapBox) {
        throw new Error('Map container not found or not visible');
    }
    await page.getByTestId('map-container').click({
        force: true,
        position: { x: mapBox.width / 2, y: mapBox.height / 2 },
    });

    // Step 2: Wait for the info panel to load the forecast.
    // The forecast section should appear.
    await expect(page.getByTestId('weather-forecast-section')).toBeVisible();

    // Expected result: The clicked position is highlighted on the map.
    await expect.poll(() => getHighlightedCoordinate(page)).toBeTruthy();

    // Expected result: The info panel displays a weather forecast section.
    // (Already asserted above)

    // Expected result: The forecast contains 24 entries.
    // The forecast entries are rendered as divs with role 'row' within the section.
    const forecastEntries = page.getByTestId('weather-forecast-section').getByRole('row');
    await expect(forecastEntries).toHaveCount(24);
});
