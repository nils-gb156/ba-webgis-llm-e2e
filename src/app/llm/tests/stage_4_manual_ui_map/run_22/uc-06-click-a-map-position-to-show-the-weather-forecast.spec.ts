// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getHighlightedCoordinate, isLayerRendered } from '../../../map-model-helpers';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Ensure the info panel is visible (it is visible by default, but we assert it anyway)
    await expect(page.getByTestId('info-panel')).toBeVisible();

    // Click on the map canvas to trigger the forecast
    // We click near the center of the map container
    const mapContainer = page.getByTestId('map-container');
    await mapContainer.click({ position: { x: 100, y: 100 } });

    // Wait for the weather forecast section to become visible
    await expect(page.getByTestId('weather-forecast')).toBeVisible();

    // Wait for the highlighted coordinate to appear on the map
    await expect.poll(() => getHighlightedCoordinate(page)).toBeTruthy();

    // Wait for the forecast entries to load and assert there are 24 entries
    // The entries are dynamic and may take a moment to render
    const forecastEntries = page.getByTestId('weather-forecast-entry');
    await expect.poll(async () => forecastEntries.count()).toBe(24);
});
