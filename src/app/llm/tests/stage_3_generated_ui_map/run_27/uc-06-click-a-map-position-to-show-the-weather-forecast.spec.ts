// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle, getHighlightedCoordinate } from '../../../map-model-helpers';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
    await page.waitForLoadState('networkidle');

    const mapContainer = page.getByTestId('map-container');
    const infoPanel = page.getByTestId('info-panel');

    await expect(mapContainer).toBeVisible();
    await expect(infoPanel).toBeVisible();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(async () => (await getHighlightedCoordinate(page)) ?? null).toBeNull();

    const mapBox = await mapContainer.boundingBox();
    if (!mapBox) {
        throw new Error('Map container has no bounding box.');
    }

    await mapContainer.click({
        position: {
            x: Math.round(mapBox.width / 2),
            y: Math.round(mapBox.height / 2)
        }
    });

    await expect.poll(async () => (await getHighlightedCoordinate(page))?.length ?? 0).toBe(2);
    await expect(infoPanel.getByTestId('weather-forecast-section')).toBeVisible();
    await expect(infoPanel.getByTestId('weather-forecast-entry')).toHaveCount(24);
});
