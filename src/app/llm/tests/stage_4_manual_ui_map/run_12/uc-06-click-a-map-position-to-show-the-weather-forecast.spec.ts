// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import {
    getActiveBaseLayerTitle,
    getHighlightedCoordinate,
    getMapZoomLevel
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

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(async () => (await getMapZoomLevel(page)) !== undefined).toBe(true);

    const initialHighlight = await getHighlightedCoordinate(page);

    const box = await mapContainer.boundingBox();
    expect(box).not.toBeNull();
    if (!box) {
        throw new Error('The map container has no bounding box and cannot be clicked.');
    }

    await mapContainer.click({
        position: {
            x: Math.round(box.width * 0.5),
            y: Math.round(box.height * 0.7)
        }
    });

    await expect.poll(async () => {
        const highlight = await getHighlightedCoordinate(page);
        return Array.isArray(highlight) && highlight.length === 2;
    }).toBe(true);

    if (initialHighlight !== undefined) {
        await expect.poll(() => getHighlightedCoordinate(page)).not.toEqual(initialHighlight);
    }

    await expect(weatherForecast).toBeVisible();
    await expect(weatherForecast.getByTestId('weather-forecast-entry')).toHaveCount(24);
});
