// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapCenter, getHighlightedCoordinate } from '../../../map-model-helpers';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const infoPanel = page.getByTestId('info-panel');
    const mapContainer = page.getByTestId('map-container');

    await expect(infoPanel).toBeVisible();
    await expect(mapContainer).toBeVisible();

    await expect.poll(async () => {
        const center = await getMapCenter(page);
        return Array.isArray(center) && center.length === 2;
    }).toBe(true);

    const initialHighlight = await getHighlightedCoordinate(page);

    const mapBox = await mapContainer.boundingBox();
    if (!mapBox) {
        throw new Error('Map container has no bounding box.');
    }

    await mapContainer.click({
        position: {
            x: Math.floor(mapBox.width * 0.75),
            y: Math.floor(mapBox.height * 0.5)
        }
    });

    await expect.poll(async () => {
        const highlight = await getHighlightedCoordinate(page);
        if (!Array.isArray(highlight) || highlight.length !== 2) {
            return false;
        }

        if (!initialHighlight) {
            return true;
        }

        return (
            highlight[0] !== initialHighlight[0] ||
            highlight[1] !== initialHighlight[1]
        );
    }).toBe(true);

    const weatherForecastSection = infoPanel.getByTestId('weather-forecast-section');
    await expect(weatherForecastSection).toBeVisible();
    await expect(weatherForecastSection.getByTestId('weather-forecast-entry')).toHaveCount(24);
});
