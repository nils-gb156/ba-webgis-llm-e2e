// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getHighlightedCoordinate, getMapZoomLevel } from '../../../map-model-helpers';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const mapContainer = page.getByTestId('map-container');
    const infoPanel = page.getByTestId('info-panel');
    const weatherForecastSection = infoPanel.getByTestId('weather-forecast-section');
    const weatherForecast = infoPanel.getByTestId('weather-forecast');
    const weatherForecastEntries = infoPanel.getByTestId('weather-forecast-entry');

    await expect(mapContainer).toBeVisible();
    await expect(infoPanel).toBeVisible();
    await expect(weatherForecastSection).toBeVisible();

    await expect.poll(() => getMapZoomLevel(page)).toBeDefined();
    await expect.poll(() => getHighlightedCoordinate(page)).toBeUndefined();

    const mapBox = await mapContainer.boundingBox();
    if (!mapBox) {
        throw new Error('Map container has no bounding box.');
    }

    const overlayBoxes = (
        await Promise.all([
            page.getByTestId('map-controls-panel').boundingBox(),
            page.getByTestId('map-toolbar').boundingBox(),
            page.getByTestId('geocoder-panel').boundingBox(),
            infoPanel.boundingBox()
        ])
    ).filter(
        (
            box
        ): box is {
            x: number;
            y: number;
            width: number;
            height: number;
        } => box !== null
    );

    const isPointInsideBox = (
        point: { x: number; y: number },
        box: { x: number; y: number; width: number; height: number }
    ) => {
        return (
            point.x >= box.x &&
            point.x <= box.x + box.width &&
            point.y >= box.y &&
            point.y <= box.y + box.height
        );
    };

    const candidatePositions = [
        { x: Math.round(mapBox.width * 0.5), y: Math.round(mapBox.height * 0.75) },
        { x: Math.round(mapBox.width * 0.35), y: Math.round(mapBox.height * 0.65) },
        { x: Math.round(mapBox.width * 0.65), y: Math.round(mapBox.height * 0.65) },
        { x: Math.round(mapBox.width * 0.5), y: Math.round(mapBox.height * 0.5) }
    ];

    const clickPosition =
        candidatePositions.find((candidate) => {
            const absolutePoint = {
                x: mapBox.x + candidate.x,
                y: mapBox.y + candidate.y
            };

            return !overlayBoxes.some((box) => isPointInsideBox(absolutePoint, box));
        }) ?? candidatePositions[0];

    await mapContainer.click({ position: clickPosition });

    await expect.poll(() => getHighlightedCoordinate(page)).toBeDefined();
    await expect(weatherForecast).toBeVisible();
    await expect(weatherForecastEntries).toHaveCount(24);
});
