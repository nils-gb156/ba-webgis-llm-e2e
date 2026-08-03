// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getHighlightedCoordinate, getMapZoomLevel } from '../../../map-model-helpers';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const mapContainer = page.getByTestId('map-container');
    const infoPanel = page.getByTestId('info-panel');
    const infoPanelToggle = page.getByTestId('info-panel-toggle');

    await expect(mapContainer).toBeVisible();

    await expect
        .poll(async () => {
            const zoom = await getMapZoomLevel(page);
            return typeof zoom === 'number';
        })
        .toBe(true);

    if (!(await infoPanel.isVisible())) {
        await infoPanelToggle.click();
    }
    await expect(infoPanel).toBeVisible();

    const mapBox = await mapContainer.boundingBox();
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
            const highlightedCoordinate = await getHighlightedCoordinate(page);
            return Array.isArray(highlightedCoordinate) && highlightedCoordinate.length === 2;
        })
        .toBe(true);

    const weatherForecastSection = infoPanel.getByTestId('weather-forecast-section');
    await expect(weatherForecastSection).toBeVisible();

    const weatherForecastEntries = weatherForecastSection.getByTestId('weather-forecast-entry');
    await expect(weatherForecastEntries).toHaveCount(24);
});
