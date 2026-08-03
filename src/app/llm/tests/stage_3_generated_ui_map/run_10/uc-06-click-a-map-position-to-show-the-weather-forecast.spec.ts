// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle, getHighlightedCoordinate } from '../../../map-model-helpers';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const infoPanel = page.getByTestId('info-panel');
    const mapContainer = page.getByTestId('map-container');
    const forecastSection = infoPanel.getByTestId('weather-forecast-section');
    const forecastEntries = forecastSection.getByTestId('weather-forecast-entry');

    await expect(mapContainer).toBeVisible();
    await expect(infoPanel).toBeVisible();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');

    const initialHighlight = await getHighlightedCoordinate(page);
    const mapBox = await mapContainer.boundingBox();
    if (!mapBox) {
        throw new Error('Map container has no bounding box.');
    }

    await mapContainer.click({
        position: {
            x: Math.round(mapBox.width * 0.75),
            y: Math.round(mapBox.height * 0.4)
        }
    });

    await expect
        .poll(async () => {
            const currentHighlight = await getHighlightedCoordinate(page);
            if (!currentHighlight) {
                return false;
            }
            if (!initialHighlight) {
                return true;
            }
            return (
                currentHighlight[0] !== initialHighlight[0] ||
                currentHighlight[1] !== initialHighlight[1]
            );
        })
        .toBe(true);

    await expect(forecastSection).toBeVisible();
    await expect(forecastEntries).toHaveCount(24);
});
