// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapCenter, getHighlightedCoordinate } from '../../../map-model-helpers';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const mapContainer = page.getByTestId('map-container');
    const infoPanel = page.getByTestId('info-panel');
    const infoPanelToggle = page.getByTestId('info-panel-toggle');

    await expect(mapContainer).toBeVisible();

    await expect
        .poll(async () => {
            const center = await getMapCenter(page);
            return Array.isArray(center) && center.length === 2;
        })
        .toBe(true);

    if (!(await infoPanel.isVisible())) {
        const pressed = await infoPanelToggle.getAttribute('aria-pressed');
        if (pressed !== 'true') {
            await infoPanelToggle.click();
        }
    }
    await expect(infoPanel).toBeVisible();

    const mapBox = await mapContainer.boundingBox();
    expect(mapBox).not.toBeNull();
    if (!mapBox) {
        throw new Error('Map container has no bounding box.');
    }

    const panelBox = await infoPanel.boundingBox();
    let clickX = Math.round(mapBox.width / 2);
    const clickY = Math.round(mapBox.height / 2);

    if (panelBox) {
        const mapCenterX = mapBox.x + mapBox.width / 2;
        const panelCenterX = panelBox.x + panelBox.width / 2;
        clickX = panelCenterX <= mapCenterX
            ? Math.round(mapBox.width * 0.8)
            : Math.round(mapBox.width * 0.2);
    }

    await mapContainer.click({
        position: {
            x: clickX,
            y: clickY
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
    await expect(weatherForecastSection.getByTestId('weather-forecast-entry')).toHaveCount(24);
});
