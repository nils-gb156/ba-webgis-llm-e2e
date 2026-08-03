// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapCenter, getHighlightedCoordinate } from '../../../map-model-helpers';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const mapContainer = page.getByTestId('map-container');
    const infoPanel = page.getByTestId('info-panel');

    await expect(mapContainer).toBeVisible();

    if (!(await infoPanel.isVisible())) {
        await page.getByTestId('info-panel-toggle').click();
    }
    await expect(infoPanel).toBeVisible();

    await expect.poll(async () => {
        const center = await getMapCenter(page);
        return Array.isArray(center) && center.length === 2;
    }).toBe(true);

    const previousHighlight = await getHighlightedCoordinate(page);

    const mapBox = await mapContainer.boundingBox();
    if (!mapBox) {
        throw new Error('Map container bounding box is unavailable.');
    }

    const infoBox = await infoPanel.boundingBox();
    const infoPanelOnLeft = infoBox
        ? infoBox.x + infoBox.width / 2 < mapBox.x + mapBox.width / 2
        : true;

    await mapContainer.click({
        position: {
            x: Math.round(mapBox.width * (infoPanelOnLeft ? 0.65 : 0.35)),
            y: Math.round(mapBox.height * 0.55)
        }
    });

    await expect.poll(async () => {
        const highlighted = await getHighlightedCoordinate(page);
        if (!highlighted) {
            return false;
        }
        if (!previousHighlight) {
            return true;
        }
        return (
            highlighted[0] !== previousHighlight[0] ||
            highlighted[1] !== previousHighlight[1]
        );
    }).toBe(true);

    await expect(infoPanel.getByTestId('weather-forecast-section')).toBeVisible();
    await expect(infoPanel.getByTestId('weather-forecast-entry')).toHaveCount(24);
});
