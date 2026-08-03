// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import {
    getHighlightedCoordinate,
    getMapCenter,
    getMapZoomLevel
} from '../../../map-model-helpers';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const mapContainer = page.getByTestId('map-container');
    const infoPanel = page.getByTestId('info-panel');
    const infoPanelToggle = page.getByTestId('info-panel-toggle');
    const weatherForecastSection = page.getByTestId('weather-forecast-section');
    const weatherForecast = page.getByTestId('weather-forecast');

    await expect(mapContainer).toBeVisible();

    await expect.poll(async () => (await getMapCenter(page)) !== undefined).toBe(true);
    await expect.poll(async () => (await getMapZoomLevel(page)) !== undefined).toBe(true);

    if (!(await infoPanel.isVisible())) {
        const pressed = await infoPanelToggle.getAttribute('aria-pressed');
        if (pressed !== 'true') {
            await infoPanelToggle.click();
        }
    }
    await expect(infoPanel).toBeVisible();

    const initialHighlight = await getHighlightedCoordinate(page);

    const mapBox = await mapContainer.boundingBox();
    if (!mapBox) {
        throw new Error('Map container has no bounding box.');
    }

    await mapContainer.click({
        position: {
            x: mapBox.width / 2,
            y: mapBox.height / 2
        }
    });

    await expect.poll(async () => {
        const highlight = await getHighlightedCoordinate(page);
        if (!highlight) {
            return false;
        }
        return (
            initialHighlight === undefined ||
            highlight[0] !== initialHighlight[0] ||
            highlight[1] !== initialHighlight[1]
        );
    }).toBe(true);

    await expect(weatherForecastSection).toBeVisible();
    await expect(weatherForecast).toBeVisible();
    await expect(weatherForecast.getByTestId('weather-forecast-entry')).toHaveCount(24);
});
