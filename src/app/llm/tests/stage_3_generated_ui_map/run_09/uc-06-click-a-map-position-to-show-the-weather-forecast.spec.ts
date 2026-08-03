// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getHighlightedCoordinate, getMapZoomLevel } from '../../../map-model-helpers';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const infoPanel = page.getByTestId('info-panel');
    const infoPanelToggle = page.getByTestId('info-panel-toggle');
    const mapContainer = page.getByTestId('map-container');

    if (!(await infoPanel.isVisible())) {
        const isPressed = await infoPanelToggle.getAttribute('aria-pressed');
        if (isPressed !== 'true') {
            await infoPanelToggle.click();
        }
    }

    await expect(infoPanel).toBeVisible();
    await expect(mapContainer).toBeVisible();
    await expect.poll(async () => typeof (await getMapZoomLevel(page)) === 'number').toBe(true);

    const mapBox = await mapContainer.boundingBox();
    expect(mapBox).not.toBeNull();

    await mapContainer.click({
        position: {
            x: Math.round((mapBox?.width ?? 0) * 0.25),
            y: Math.round((mapBox?.height ?? 0) * 0.5)
        }
    });

    await expect.poll(async () => (await getHighlightedCoordinate(page)) !== undefined).toBe(true);

    const weatherForecastSection = infoPanel.getByTestId('weather-forecast-section');
    const weatherForecastEntries = infoPanel.getByTestId('weather-forecast-entry');

    await expect(weatherForecastSection).toBeVisible();
    await expect(weatherForecastEntries).toHaveCount(24);
});
