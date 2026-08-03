// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getHighlightedCoordinate, getMapZoomLevel } from '../../../../map-model-helpers';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const mapContainer = page.getByTestId('map-container');
    const infoPanel = page.getByTestId('info-panel');
    const infoPanelToggle = page.getByTestId('info-panel-toggle');
    const weatherForecastSection = page.getByTestId('weather-forecast-section');
    const weatherForecast = page.getByTestId('weather-forecast');
    const forecastEntries = page.getByTestId('weather-forecast-entry');
    const emptyStateText = infoPanel.getByText('Click on the map to load a forecast.');

    await expect(mapContainer).toBeVisible();
    await expect.poll(() => getMapZoomLevel(page)).not.toBeUndefined();

    const infoPanelVisible = await infoPanel.isVisible();
    const infoPanelPressed = await infoPanelToggle.getAttribute('aria-pressed');
    if (!infoPanelVisible) {
        expect(infoPanelPressed).toBe('false');
        await infoPanelToggle.click();
    }

    await expect(infoPanel).toBeVisible();
    await expect(infoPanelToggle).toHaveAttribute('aria-pressed', 'true');
    await expect(weatherForecastSection).toBeVisible();
    await expect(
        weatherForecastSection.getByRole('heading', { name: 'Weather Forecast', exact: true })
    ).toBeVisible();
    await expect(emptyStateText).toBeVisible();

    const mapBox = await mapContainer.boundingBox();
    expect(mapBox).not.toBeNull();

    await mapContainer.click({
        position: {
            x: Math.round(mapBox!.width * 0.58),
            y: Math.round(mapBox!.height * 0.42)
        }
    });

    await expect.poll(() => getHighlightedCoordinate(page)).not.toBeUndefined();
    await expect(emptyStateText).not.toBeVisible();
    await expect(weatherForecastSection).toBeVisible();
    await expect(weatherForecast).toBeVisible();
    await expect(weatherForecastSection.getByText(/^Location:/)).toBeVisible();
    await expect(forecastEntries).toHaveCount(24);
});
