// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getHighlightedCoordinate, getMapZoomLevel } from '../../../../map-model-helpers';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const mapContainer = page.getByTestId('map-container');
    const infoPanel = page.getByTestId('info-panel');
    const weatherForecastSection = page.getByTestId('weather-forecast-section');
    const weatherForecast = page.getByTestId('weather-forecast');
    const weatherForecastEntries = page.getByTestId('weather-forecast-entry');

    await expect(mapContainer).toBeVisible();
    await expect.poll(() => getMapZoomLevel(page), { timeout: 15000 }).toBeGreaterThan(0);

    await expect(infoPanel).toBeVisible();
    await expect(weatherForecastSection).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Weather Forecast', exact: true })).toBeVisible();
    await expect(infoPanel.getByText('Click on the map to load a forecast.', { exact: true })).toBeVisible();

    const initialHighlight = await getHighlightedCoordinate(page);

    const box = await mapContainer.boundingBox();
    if (!box) {
        throw new Error('Map container has no bounding box.');
    }

    await mapContainer.click({
        position: {
            x: Math.round(box.width * 0.55),
            y: Math.round(box.height * 0.45)
        }
    });

    await expect
        .poll(async () => {
            const highlightedCoordinate = await getHighlightedCoordinate(page);
            return (
                Array.isArray(highlightedCoordinate) &&
                highlightedCoordinate.length === 2 &&
                JSON.stringify(highlightedCoordinate) !== JSON.stringify(initialHighlight)
            );
        }, { timeout: 15000 })
        .toBe(true);

    await expect(weatherForecast).toBeVisible();
    await expect(infoPanel.getByText('Click on the map to load a forecast.', { exact: true })).toBeHidden();
    await expect(weatherForecastEntries).toHaveCount(24);
});
