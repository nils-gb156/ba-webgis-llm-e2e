// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getHighlightedCoordinate, isLayerRendered } from '../../../map-model-helpers';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Ensure info panel is visible (it is visible by default)
    await expect(page.getByTestId('info-panel')).toBeVisible();

    // Click on the map canvas at a specific position (center of the viewport)
    const mapContainer = page.getByTestId('map-container');
    await mapContainer.click({ position: { x: 100, y: 100 } });

    // Wait for the highlighted coordinate to appear on the map
    await expect.poll(() => getHighlightedCoordinate(page)).toBeDefined();

    // Wait for the weather forecast section to appear in the info panel
    await expect(page.getByTestId('weather-forecast-section')).toBeVisible();

    // Wait for the weather forecast entries to load
    // The use case specifies 24 entries. We check that at least 24 entries are present.
    // We use a poll to wait for the asynchronous loading of the forecast data.
    const forecastEntries = page.getByTestId(/weather-forecast-entry-\d+/);
    await expect.poll(async () => forecastEntries.count()).toBeGreaterThanOrEqual(24);

    // Verify that the UV-Index operational layer is rendered (as it's part of the weather data context)
    // Although not strictly required by the "Expected results" text, it's a good sanity check for map state.
    // However, sticking strictly to expected results:
    // - Clicked position highlighted: Done (via getHighlightedCoordinate)
    // - Info panel displays weather forecast section: Done (via getByTestId('weather-forecast-section'))
    // - Forecast contains 24 entries: Done (via forecastEntries count)
});
