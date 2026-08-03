// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getHighlightedCoordinate, getMapCenter } from '../../../map-model-helpers';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const mapContainer = page.getByTestId('map-container');
    const infoPanel = page.getByTestId('info-panel');
    const weatherForecastSection = infoPanel.getByTestId('weather-forecast-section');
    const weatherForecast = infoPanel.getByTestId('weather-forecast');
    const forecastEntries = weatherForecast.getByTestId('weather-forecast-entry');

    await expect(mapContainer).toBeVisible();
    await expect(infoPanel).toBeVisible();
    await expect(weatherForecastSection).toBeVisible();

    await expect
        .poll(async () => {
            const center = await getMapCenter(page);
            return Array.isArray(center) && center.length === 2;
        })
        .toBe(true);

    const mapBox = await mapContainer.boundingBox();
    if (!mapBox) {
        throw new Error('The map container has no bounding box.');
    }

    await mapContainer.click({
        position: {
            x: Math.round(Math.min(Math.max(mapBox.width * 0.5, 20), mapBox.width - 20)),
            y: Math.round(Math.min(Math.max(mapBox.height * 0.7, 20), mapBox.height - 20))
        }
    });

    await expect
        .poll(async () => {
            const coordinate = await getHighlightedCoordinate(page);
            return Array.isArray(coordinate) && coordinate.length === 2;
        })
        .toBe(true);

    await expect(weatherForecast).toBeVisible();
    await expect(forecastEntries).toHaveCount(24);
});
