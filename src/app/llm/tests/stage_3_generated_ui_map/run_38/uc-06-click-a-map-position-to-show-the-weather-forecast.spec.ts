// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getHighlightedCoordinate, isLayerRendered } from '../../../map-model-helpers';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Ensure info panel is visible (it is visible by default)
    await expect(page.getByTestId('info-panel')).toBeVisible();

    // Click on the map canvas to trigger GetFeatureInfo / forecast
    const mapContainer = page.getByTestId('map-container');
    await mapContainer.click({ position: { x: 100, y: 100 } });

    // Wait for the highlight to appear on the map
    await expect.poll(() => getHighlightedCoordinate(page)).toBeDefined();

    // Wait for the weather forecast section to appear in the info panel
    await expect(page.getByTestId('weather-forecast-section')).toBeVisible();

    // Wait for the forecast entries to load
    const forecastEntries = page.getByTestId('weather-forecast-entry');
    await expect(forecastEntries).toHaveCount(24);
});
