// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle, getHighlightedCoordinate } from '../../../map-model-helpers';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const mapContainer = page.getByTestId('map-container');
    const infoPanel = page.getByTestId('info-panel');
    const infoPanelToggle = page.getByTestId('info-panel-toggle');

    await expect(mapContainer).toBeVisible();
    await expect(infoPanelToggle).toBeVisible();
    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');

    if (!(await infoPanel.isVisible())) {
        await infoPanelToggle.click();
    }
    await expect(infoPanel).toBeVisible();

    await expect.poll(() => getHighlightedCoordinate(page)).toBeUndefined();

    const box = await mapContainer.boundingBox();
    if (!box) {
        throw new Error('Map container has no bounding box.');
    }

    await mapContainer.click({
        position: {
            x: Math.round(box.width * 0.65),
            y: Math.round(box.height * 0.45)
        }
    });

    await expect.poll(async () => {
        const coordinate = await getHighlightedCoordinate(page);
        return Array.isArray(coordinate) && coordinate.length === 2;
    }).toBe(true);

    const weatherForecastSection = infoPanel.getByTestId('weather-forecast-section');
    await expect(weatherForecastSection).toBeVisible();
    await expect(weatherForecastSection.getByTestId('weather-forecast-entry')).toHaveCount(24);
});
