// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getHighlightedCoordinate, getMapCenter, getMapZoomLevel } from "../../../map-model-helpers";

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const mapContainer = page.getByTestId('map-container');
    const infoPanel = page.getByTestId('info-panel');
    const infoPanelToggle = page.getByTestId('info-panel-toggle');

    await expect(mapContainer).toBeVisible();

    if (!(await infoPanel.isVisible())) {
        await infoPanelToggle.click();
    }
    await expect(infoPanel).toBeVisible();

    await expect.poll(() => getMapZoomLevel(page)).not.toBeUndefined();
    await expect.poll(() => getMapCenter(page)).not.toBeUndefined();
    await expect.poll(() => getHighlightedCoordinate(page)).toBeUndefined();

    const initialCenter = await getMapCenter(page);
    if (!initialCenter) {
        throw new Error('Map center was not available after the map became ready.');
    }

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
        const highlighted = await getHighlightedCoordinate(page);
        if (!highlighted) {
            return false;
        }

        return (
            Math.abs(highlighted[0] - initialCenter[0]) < 1000 &&
            Math.abs(highlighted[1] - initialCenter[1]) < 1000
        );
    }).toBe(true);

    const weatherForecastSection = infoPanel.getByTestId('weather-forecast-section');
    const weatherForecastEntries = infoPanel.getByTestId('weather-forecast-entry');

    await expect(weatherForecastSection).toBeVisible();
    await expect(weatherForecastEntries).toHaveCount(24);
});
