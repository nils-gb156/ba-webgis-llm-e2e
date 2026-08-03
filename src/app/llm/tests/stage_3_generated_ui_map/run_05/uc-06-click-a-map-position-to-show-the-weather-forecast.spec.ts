// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle, getHighlightedCoordinate } from '../../../map-model-helpers';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');

    const infoPanel = page.getByTestId('info-panel');
    await expect(infoPanel).toBeVisible();

    const mapContainer = page.getByTestId('map-container');
    await expect(mapContainer).toBeVisible();

    const initialHighlight = await getHighlightedCoordinate(page);
    const mapBox = await mapContainer.boundingBox();
    if (!mapBox) {
        throw new Error('Map container has no bounding box.');
    }

    await mapContainer.click({
        position: {
            x: Math.round(mapBox.width * 0.75),
            y: Math.round(mapBox.height * 0.5)
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

    const forecastSection = infoPanel.getByTestId('weather-forecast-section');
    await expect(forecastSection).toBeVisible();
    await expect(forecastSection.getByTestId('weather-forecast-entry')).toHaveCount(24);
});
