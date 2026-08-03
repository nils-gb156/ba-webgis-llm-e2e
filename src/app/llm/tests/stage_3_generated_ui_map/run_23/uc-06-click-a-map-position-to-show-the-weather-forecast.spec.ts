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
    const weatherForecastSection = infoPanel.getByTestId('weather-forecast-section');
    const weatherForecastEntries = infoPanel.getByTestId('weather-forecast-entry');

    await expect(mapContainer).toBeVisible();
    await expect(infoPanel).toBeVisible();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(() => getMapZoomLevel(page)).toBeGreaterThan(0);

    const previousHighlight = await getHighlightedCoordinate(page);

    const box = await mapContainer.boundingBox();
    if (!box) {
        throw new Error('Map container is not visible and cannot be clicked.');
    }

    await mapContainer.click({
        position: {
            x: Math.max(20, Math.floor(box.width * 0.5)),
            y: Math.max(20, Math.floor(box.height * 0.5))
        }
    });

    await expect
        .poll(async () => {
            const currentHighlight = await getHighlightedCoordinate(page);
            if (!currentHighlight) {
                return false;
            }

            if (!previousHighlight) {
                return true;
            }

            return (
                currentHighlight[0] !== previousHighlight[0] ||
                currentHighlight[1] !== previousHighlight[1]
            );
        })
        .toBe(true);

    await expect(weatherForecastSection).toBeVisible();
    await expect(weatherForecastEntries).toHaveCount(24);
});
