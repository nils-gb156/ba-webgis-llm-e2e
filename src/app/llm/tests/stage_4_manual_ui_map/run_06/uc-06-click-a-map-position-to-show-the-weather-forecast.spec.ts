// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getHighlightedCoordinate, isLayerRendered } from '../../../map-model-helpers';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Ensure the map container is visible and interactive
    await expect(page.getByTestId('map-container')).toBeVisible();

    // Click on the center of the map canvas to trigger a forecast request
    const mapContainer = page.getByTestId('map-container');
    await mapContainer.click({ position: { x: 50, y: 50 } });

    // Wait for the highlighted coordinate to appear on the map, confirming the click was processed
    await expect.poll(() => getHighlightedCoordinate(page)).toBeDefined();

    // Wait for the weather forecast section to become visible in the info panel
    await expect(page.getByTestId('weather-forecast')).toBeVisible();

    // Wait for the forecast entries to load (24 entries expected)
    const forecastEntries = page.getByTestId('weather-forecast-entry');
    await expect.poll(async () => forecastEntries.count()).toBe(24);
});
