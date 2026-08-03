// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getHighlightedCoordinate, getMapCenter } from "../../../../map-model-helpers";

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const mapContainer = page.getByTestId('map-container');
    const infoPanel = page.getByTestId('info-panel');
    const infoPanelToggle = page.getByTestId('info-panel-toggle');
    const weatherForecastSection = page.getByTestId('weather-forecast-section');
    const weatherForecast = page.getByTestId('weather-forecast');
    const forecastEntries = page.getByTestId('weather-forecast-entry');

    await expect(mapContainer).toBeVisible();
    await expect.poll(async () => (await getMapCenter(page)) !== undefined).toBe(true);

    if (!(await infoPanel.isVisible())) {
        await expect(infoPanelToggle).toBeVisible();
        if ((await infoPanelToggle.getAttribute('aria-pressed')) !== 'true') {
            await infoPanelToggle.click();
        }
    }

    await expect(infoPanel).toBeVisible();
    await expect(infoPanelToggle).toHaveAttribute('aria-pressed', 'true');
    await expect(
        infoPanel.getByRole('heading', { name: 'Information', exact: true })
    ).toBeVisible();
    await expect(
        weatherForecastSection.getByRole('heading', { name: 'Weather Forecast', exact: true })
    ).toBeVisible();
    await expect(weatherForecastSection).toContainText('Click on the map to load a forecast.');
    await expect(weatherForecast).toHaveCount(0);
    await expect.poll(() => getHighlightedCoordinate(page)).toBeUndefined();

    await mapContainer.click({
        position: {
            x: 680,
            y: 385
        }
    });

    await expect.poll(async () => (await getHighlightedCoordinate(page)) !== undefined).toBe(true);
    await expect(weatherForecastSection).not.toContainText('Click on the map to load a forecast.');
    await expect(weatherForecast).toBeVisible();
    await expect(forecastEntries).toHaveCount(24);
});
