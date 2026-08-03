// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getHighlightedCoordinate, getMapZoomLevel } from '../../../../map-model-helpers';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    await expect(page.getByRole('application', { name: 'webgis map', exact: true })).toBeVisible();
    await expect(page.getByTestId('map-container')).toBeVisible();

    await expect.poll(() => getMapZoomLevel(page)).toBeGreaterThan(0);

    const infoPanelToggle = page.getByTestId('info-panel-toggle');
    const infoPanel = page.getByTestId('info-panel');
    const weatherForecastSection = page.getByTestId('weather-forecast-section');

    await expect(infoPanelToggle).toBeVisible();
    if ((await infoPanelToggle.getAttribute('aria-pressed')) !== 'true') {
        await infoPanelToggle.click();
    }

    await expect(infoPanel).toBeVisible();
    await expect(infoPanel.getByRole('heading', { name: 'Information', exact: true })).toBeVisible();
    await expect(weatherForecastSection).toBeVisible();
    await expect(
        weatherForecastSection.getByRole('heading', { name: 'Weather Forecast', exact: true })
    ).toBeVisible();
    await expect(weatherForecastSection.getByText('Click on the map to load a forecast.')).toBeVisible();

    await expect.poll(() => getHighlightedCoordinate(page)).toBe(undefined);

    await page.getByTestId('map-container').click({
        position: { x: 700, y: 400 }
    });

    await expect.poll(async () => {
        const coordinate = await getHighlightedCoordinate(page);
        return coordinate?.length;
    }).toBe(2);

    await expect(weatherForecastSection).toBeVisible();
    await expect(
        weatherForecastSection.getByRole('heading', { name: 'Weather Forecast', exact: true })
    ).toBeVisible();
    await expect(weatherForecastSection.getByText('Click on the map to load a forecast.')).not.toBeVisible();

    const weatherForecast = page.getByTestId('weather-forecast');
    await expect(weatherForecast).toBeVisible();

    await expect.poll(() => weatherForecast.getByTestId('weather-forecast-entry').count()).toBe(24);
});
