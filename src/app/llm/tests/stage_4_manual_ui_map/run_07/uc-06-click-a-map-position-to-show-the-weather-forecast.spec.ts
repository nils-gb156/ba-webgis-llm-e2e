// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapCenter, getHighlightedCoordinate } from '../../../map-model-helpers';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const mapContainer = page.getByTestId('map-container');
    const infoPanel = page.getByTestId('info-panel');
    const infoPanelToggle = page.getByTestId('info-panel-toggle');
    const weatherForecastSection = page.getByTestId('weather-forecast-section');
    const weatherForecast = page.getByTestId('weather-forecast');
    const forecastEntries = page.getByTestId('weather-forecast-entry');

    await expect(mapContainer).toBeVisible();

    await expect.poll(async () => (await getMapCenter(page)) !== undefined).toBe(true);

    if (!(await infoPanel.isVisible())) {
        await expect(infoPanelToggle).toBeVisible();
        const pressed = await infoPanelToggle.getAttribute('aria-pressed');
        if (pressed !== 'true') {
            await infoPanelToggle.click();
        }
    }

    await expect(infoPanel).toBeVisible();
    await expect(weatherForecastSection).toBeVisible();

    const initialHighlight = await getHighlightedCoordinate(page);

    const box = await mapContainer.boundingBox();
    expect(box).not.toBeNull();
    if (!box) {
        throw new Error('Map container has no bounding box.');
    }

    await mapContainer.click({
        position: {
            x: Math.round(box.width * 0.55),
            y: Math.round(box.height * 0.6)
        }
    });

    await expect
        .poll(async () => {
            const highlight = await getHighlightedCoordinate(page);
            if (!highlight) {
                return false;
            }
            if (!initialHighlight) {
                return true;
            }
            return highlight[0] !== initialHighlight[0] || highlight[1] !== initialHighlight[1];
        })
        .toBe(true);

    await expect(weatherForecast).toBeVisible();
    await expect(forecastEntries).toHaveCount(24);
});
