// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import {
    getActiveBaseLayerTitle,
    getMapCenter,
    getHighlightedCoordinate
} from '../../../map-model-helpers';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(async () => (await getMapCenter(page)) !== undefined).toBe(true);

    const infoPanel = page.getByTestId('info-panel');
    await expect(infoPanel).toBeVisible();

    const mapContainer = page.getByTestId('map-container');
    await expect(mapContainer).toBeVisible();

    const previousHighlight = await getHighlightedCoordinate(page);
    const previousHighlightKey = previousHighlight?.join(',');

    const mapBox = await mapContainer.boundingBox();
    if (!mapBox) {
        throw new Error('Map container has no bounding box.');
    }

    await mapContainer.click({
        position: {
            x: Math.max(50, Math.floor(mapBox.width * 0.6)),
            y: Math.max(50, Math.floor(mapBox.height * 0.4))
        }
    });

    await expect.poll(async () => (await getHighlightedCoordinate(page))?.join(',')).not.toBe(previousHighlightKey);

    const weatherForecastSection = page.getByTestId('weather-forecast-section');
    await expect(weatherForecastSection).toBeVisible();

    const weatherForecastEntries = page.getByTestId('weather-forecast-entry');
    await expect(weatherForecastEntries).toHaveCount(24);
});
