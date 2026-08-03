// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getHighlightedCoordinate, getMapCenter } from '../../../../map-model-helpers';

test('UC-06: Click a map position to show the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
    await page.waitForLoadState('domcontentloaded');

    const mapContainer = page.getByTestId('map-container');
    const infoPanel = page.getByTestId('info-panel');
    const infoPanelToggle = page.getByTestId('info-panel-toggle');
    const weatherForecastSection = page.getByTestId('weather-forecast-section');
    const weatherForecast = page.getByTestId('weather-forecast');
    const forecastEntries = page.getByTestId('weather-forecast-entry');
    const informationHeading = page.getByRole('heading', { name: 'Information', exact: true });
    const weatherForecastHeading = page.getByRole('heading', { name: 'Weather Forecast', exact: true });
    const forecastPlaceholder = weatherForecastSection.getByText('Click on the map to load a forecast.', {
        exact: true
    });

    await expect(mapContainer).toBeVisible();
    await expect(infoPanelToggle).toBeVisible();

    if ((await infoPanelToggle.getAttribute('aria-pressed')) !== 'true') {
        await infoPanelToggle.click();
    }

    await expect(infoPanelToggle).toHaveAttribute('aria-pressed', 'true');
    await expect(infoPanel).toBeVisible();
    await expect(informationHeading).toBeVisible();
    await expect(weatherForecastSection).toBeVisible();
    await expect(weatherForecastHeading).toBeVisible();
    await expect(forecastPlaceholder).toBeVisible();

    await expect.poll(() => getMapCenter(page)).not.toBeUndefined();

    const mapBox = await mapContainer.boundingBox();
    expect(mapBox).not.toBeNull();

    await mapContainer.click({
        position: {
            x: Math.round(mapBox!.width * 0.55),
            y: Math.round(mapBox!.height * 0.45)
        }
    });

    await expect.poll(() => getHighlightedCoordinate(page)).not.toBeUndefined();
    await expect(weatherForecastSection).toBeVisible();
    await expect(weatherForecastHeading).toBeVisible();
    await expect(weatherForecast).toBeVisible();
    await expect(forecastPlaceholder).not.toBeVisible();
    await expect(forecastEntries).toHaveCount(24);
});
