// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getHighlightedCoordinate, getMapZoomLevel } from '../../../../map-model-helpers';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const mapContainer = page.getByTestId('map-container');
    const infoPanel = page.getByTestId('info-panel');
    const infoPanelToggle = page.getByTestId('info-panel-toggle');
    const weatherForecastSection = page.getByTestId('weather-forecast-section');
    const weatherForecast = page.getByTestId('weather-forecast');
    const weatherForecastEntries = weatherForecast.getByTestId('weather-forecast-entry');
    const placeholderText = weatherForecastSection.getByText('Click on the map to load a forecast.', { exact: true });

    await expect(mapContainer).toBeVisible();
    await expect.poll(async () => typeof (await getMapZoomLevel(page)) === 'number').toBe(true);

    if (!(await infoPanel.isVisible())) {
        await expect(infoPanelToggle).toHaveAttribute('aria-pressed', 'false');
        await infoPanelToggle.click();
    }
    await expect(infoPanel).toBeVisible();
    await expect(infoPanelToggle).toHaveAttribute('aria-pressed', 'true');

    await expect(weatherForecastSection).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Weather Forecast', exact: true })).toBeVisible();
    await expect(placeholderText).toBeVisible();
    await expect(weatherForecastEntries).toHaveCount(0);
    await expect.poll(async () => (await getHighlightedCoordinate(page)) === undefined).toBe(true);

    const mapBox = await mapContainer.boundingBox();
    if (!mapBox) {
        throw new Error('Map container has no bounding box.');
    }

    await mapContainer.click({
        position: {
            x: Math.round(mapBox.width * 0.5),
            y: Math.round(mapBox.height * 0.45)
        }
    });

    await expect.poll(async () => {
        const coordinate = await getHighlightedCoordinate(page);
        return Array.isArray(coordinate) && coordinate.length === 2;
    }, { timeout: 10000 }).toBe(true);

    await expect(weatherForecast).toBeVisible({ timeout: 15000 });
    await expect(weatherForecastSection.getByText(/^Location:/)).toBeVisible({ timeout: 15000 });
    await expect(weatherForecastEntries).toHaveCount(24, { timeout: 15000 });
});
