// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import {
    getActiveBaseLayerTitle,
    getHighlightedCoordinate
} from '../../../map-model-helpers';

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

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(async () => (await getHighlightedCoordinate(page)) === undefined).toBe(true);

    const mapSize = await mapContainer.evaluate((element) => ({
        width: (element as HTMLElement).clientWidth,
        height: (element as HTMLElement).clientHeight
    }));

    await mapContainer.click({
        position: {
            x: Math.round(mapSize.width * 0.5),
            y: Math.round(mapSize.height * 0.65)
        }
    });

    await expect.poll(async () => {
        const coordinate = await getHighlightedCoordinate(page);
        return Array.isArray(coordinate) && coordinate.length === 2;
    }).toBe(true);

    await expect(weatherForecast).toBeVisible();
    await expect(weatherForecast.getByTestId('weather-forecast-entry')).toHaveCount(24);
});
