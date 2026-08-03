// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getHighlightedCoordinate, getMapZoomLevel } from '../../../map-model-helpers';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const mapContainer = page.getByTestId('map-container');
    const infoPanel = page.getByTestId('info-panel');
    const forecastSection = infoPanel.getByTestId('weather-forecast-section');
    const forecastEntries = forecastSection.getByTestId('weather-forecast-entry');

    await expect(mapContainer).toBeVisible();
    await expect(infoPanel).toBeVisible();
    await expect.poll(() => getMapZoomLevel(page)).not.toBeUndefined();

    const initialHighlight = await getHighlightedCoordinate(page);
    const mapBox = await mapContainer.boundingBox();

    if (!mapBox) {
        throw new Error('The map container has no bounding box and cannot be clicked.');
    }

    await mapContainer.click({
        position: {
            x: Math.floor(mapBox.width * 0.5),
            y: Math.floor(mapBox.height * 0.5),
        },
    });

    if (initialHighlight) {
        await expect.poll(() => getHighlightedCoordinate(page)).not.toEqual(initialHighlight);
    } else {
        await expect.poll(() => getHighlightedCoordinate(page)).not.toBeUndefined();
    }

    await expect(forecastSection).toBeVisible();
    await expect(forecastEntries).toHaveCount(24);
});
