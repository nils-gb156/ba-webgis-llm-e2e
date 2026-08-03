// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import {
    getActiveBaseLayerTitle,
    getHighlightedCoordinate,
    getMapCenter,
    getMapZoomLevel
} from '../../../map-model-helpers';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
    await page.waitForLoadState('domcontentloaded');

    const mapContainer = page.getByTestId('map-container');
    const infoPanel = page.getByTestId('info-panel');
    const weatherForecastSection = page.getByTestId('weather-forecast-section');

    await expect(mapContainer).toBeVisible();
    await expect(infoPanel).toBeVisible();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(async () => (await getMapCenter(page)) !== undefined).toBe(true);
    await expect.poll(async () => (await getMapZoomLevel(page)) !== undefined).toBe(true);

    const highlightBefore = await getHighlightedCoordinate(page);

    const mapBox = await mapContainer.boundingBox();
    expect(mapBox).not.toBeNull();
    if (!mapBox) {
        throw new Error('Map container has no bounding box.');
    }

    await mapContainer.click({
        position: {
            x: Math.round(mapBox.width * 0.5),
            y: Math.round(mapBox.height * 0.5)
        }
    });

    await expect
        .poll(async () => {
            const highlightAfter = await getHighlightedCoordinate(page);
            if (!highlightAfter) {
                return false;
            }

            if (!highlightBefore) {
                return true;
            }

            return (
                highlightAfter[0] !== highlightBefore[0] ||
                highlightAfter[1] !== highlightBefore[1]
            );
        })
        .toBe(true);

    await expect(weatherForecastSection).toBeVisible();
    await expect(weatherForecastSection.getByTestId('weather-forecast-entry')).toHaveCount(24);
});
