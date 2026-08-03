// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle, getHighlightedCoordinate, getMapZoomLevel } from '../../../map-model-helpers';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const mapContainer = page.getByTestId('map-container');
    const infoPanel = page.getByTestId('info-panel');
    const infoPanelToggle = page.getByTestId('info-panel-toggle');
    const weatherForecastSection = page.getByTestId('weather-forecast-section');
    const weatherForecast = page.getByTestId('weather-forecast');
    const weatherForecastEntries = page.getByTestId('weather-forecast-entry');

    await expect(mapContainer).toBeVisible();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(async () => typeof (await getMapZoomLevel(page)) === 'number').toBe(true);

    if (!(await infoPanel.isVisible())) {
        if ((await infoPanelToggle.getAttribute('aria-pressed')) !== 'true') {
            await infoPanelToggle.click();
        }
        await expect(infoPanel).toBeVisible();
    }

    await expect(infoPanel).toBeVisible();
    await expect(weatherForecastSection).toBeVisible();
    await expect(weatherForecast).toBeHidden();

    await expect.poll(async () => (await getHighlightedCoordinate(page)) === undefined).toBe(true);

    const mapBox = await mapContainer.boundingBox();
    expect(mapBox).not.toBeNull();

    await mapContainer.click({
        position: {
            x: Math.min(Math.floor((mapBox?.width ?? 800) * 0.5), Math.floor((mapBox?.width ?? 800) - 20)),
            y: Math.min(Math.floor((mapBox?.height ?? 600) * 0.65), Math.floor((mapBox?.height ?? 600) - 20))
        }
    });

    await expect.poll(async () => {
        const coordinate = await getHighlightedCoordinate(page);
        return Array.isArray(coordinate) && coordinate.length === 2;
    }).toBe(true);

    await expect(weatherForecast).toBeVisible();
    await expect(weatherForecastEntries).toHaveCount(24);
});
