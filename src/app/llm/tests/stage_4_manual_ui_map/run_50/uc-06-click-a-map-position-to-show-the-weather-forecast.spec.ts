// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapCenter, getMapZoomLevel, getHighlightedCoordinate } from '../../../map-model-helpers';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
    await page.waitForLoadState('domcontentloaded');

    const mapContainer = page.getByTestId('map-container');
    const infoPanel = page.getByTestId('info-panel');
    const weatherForecastSection = page.getByTestId('weather-forecast-section');
    const weatherForecast = page.getByTestId('weather-forecast');
    const weatherForecastEntries = page.getByTestId('weather-forecast-entry');

    await expect(mapContainer).toBeVisible();
    await expect(infoPanel).toBeVisible();
    await expect(weatherForecastSection).toBeVisible();
    await expect(weatherForecast).toBeHidden();

    await expect.poll(async () => {
        const center = await getMapCenter(page);
        const zoom = await getMapZoomLevel(page);
        return center !== undefined && zoom !== undefined;
    }).toBe(true);

    const mapBox = await mapContainer.boundingBox();
    if (!mapBox) {
        throw new Error('Map container has no bounding box.');
    }

    await mapContainer.click({
        position: {
            x: Math.floor(mapBox.width * 0.6),
            y: Math.floor(mapBox.height * 0.7)
        }
    });

    await expect.poll(async () => {
        const highlightedCoordinate = await getHighlightedCoordinate(page);
        return Array.isArray(highlightedCoordinate) && highlightedCoordinate.length === 2;
    }).toBe(true);

    await expect(weatherForecast).toBeVisible();
    await expect(weatherForecastEntries).toHaveCount(24);
});
