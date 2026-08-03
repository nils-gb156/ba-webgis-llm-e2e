// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getHighlightedCoordinate, getMapCenter } from "../../../map-model-helpers";

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const mapContainer = page.getByTestId('map-container');
    const infoPanel = page.getByTestId('info-panel');
    const weatherForecastSection = page.getByTestId('weather-forecast-section');
    const weatherForecast = page.getByTestId('weather-forecast');

    await expect(mapContainer).toBeVisible();
    await expect(infoPanel).toBeVisible();
    await expect(weatherForecastSection).toBeVisible();
    await expect(weatherForecast).toBeHidden();

    await expect.poll(async () => (await getMapCenter(page)) !== undefined).toBe(true);

    const mapCenterBeforeClick = await getMapCenter(page);
    if (!mapCenterBeforeClick) {
        throw new Error('Map center is not available although the map should be ready.');
    }

    const mapBox = await mapContainer.boundingBox();
    if (!mapBox) {
        throw new Error('Map container bounding box is not available.');
    }

    await mapContainer.click({
        position: {
            x: Math.floor(mapBox.width / 2),
            y: Math.floor(mapBox.height / 2)
        }
    });

    await expect.poll(async () => {
        const highlightedCoordinate = await getHighlightedCoordinate(page);
        if (!highlightedCoordinate) {
            return false;
        }

        return (
            Math.abs(highlightedCoordinate[0] - mapCenterBeforeClick[0]) < 5000 &&
            Math.abs(highlightedCoordinate[1] - mapCenterBeforeClick[1]) < 5000
        );
    }).toBe(true);

    await expect(weatherForecast).toBeVisible();
    await expect(weatherForecast.getByTestId('weather-forecast-entry')).toHaveCount(24);
});
