// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getHighlightedCoordinate, isLayerRendered } from '../../../map-model-helpers';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Ensure info panel is visible (it is visible by default, but let's be safe)
    await expect(page.getByTestId('info-panel')).toBeVisible();

    // Click on the map canvas to trigger the weather forecast
    // Using a center position to ensure we click on the map container
    const mapContainer = page.getByTestId('map-container');
    await mapContainer.click({ position: { x: 100, y: 100 } });

    // Wait for the info panel to load the forecast
    // The info panel should already be visible, but we wait for the content to settle
    await expect(page.getByTestId('weather-forecast-section')).toBeVisible();

    // Assert that the clicked position is highlighted on the map
    await expect.poll(() => getHighlightedCoordinate(page)).toBeTruthy();

    // Assert that the info panel displays a weather forecast section
    await expect(page.getByTestId('weather-forecast-section')).toBeVisible();

    // Assert that the forecast contains 24 entries
    const forecastEntries = page.getByTestId(/weather-forecast-entry-\d+/);
    await expect(forecastEntries).toHaveCount(24);
});
