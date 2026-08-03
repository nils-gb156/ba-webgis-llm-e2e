// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapCenter, getMapZoomLevel, getHighlightedCoordinate } from '../../../map-model-helpers';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    await expect(page.getByTestId('info-panel')).toBeVisible();
    await expect(page.getByTestId('map-container')).toBeVisible();

    await expect.poll(() => getMapZoomLevel(page)).not.toBeUndefined();
    await expect.poll(() => getMapCenter(page)).not.toBeUndefined();

    const highlightBefore = await getHighlightedCoordinate(page);

    const mapContainer = page.getByTestId('map-container');
    const mapBox = await mapContainer.boundingBox();
    expect(mapBox).not.toBeNull();

    await mapContainer.click({
        position: {
            x: Math.max(20, Math.floor((mapBox?.width ?? 0) / 2)),
            y: Math.max(20, Math.floor((mapBox?.height ?? 0) / 2))
        }
    });

    await expect
        .poll(async () => {
            const coordinate = await getHighlightedCoordinate(page);
            return coordinate ? JSON.stringify(coordinate) : undefined;
        })
        .not.toBeUndefined();

    if (highlightBefore) {
        await expect
            .poll(async () => {
                const coordinate = await getHighlightedCoordinate(page);
                return coordinate ? JSON.stringify(coordinate) : undefined;
            })
            .not.toBe(JSON.stringify(highlightBefore));
    }

    await expect(page.getByTestId('weather-forecast-section')).toBeVisible();
    await expect(page.getByTestId('weather-forecast-entry')).toHaveCount(24);
});
