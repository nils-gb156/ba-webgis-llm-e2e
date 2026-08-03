// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getActiveBaseLayerTitle, getHighlightedCoordinate, getMapZoomLevel } from '../../../../map-model-helpers';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const mapContainer = page.getByTestId('map-container');
    const infoPanel = page.getByTestId('info-panel');
    const infoPanelToggle = page.getByTestId('info-panel-toggle');
    const weatherForecastSection = page.getByTestId('weather-forecast-section');
    const weatherForecast = infoPanel.getByTestId('weather-forecast');
    const forecastEntries = infoPanel.getByTestId('weather-forecast-entry');

    await expect(mapContainer).toBeVisible();
    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(async () => typeof (await getMapZoomLevel(page))).toBe('number');

    if (!(await infoPanel.isVisible())) {
        await expect(infoPanelToggle).toHaveAttribute('aria-pressed', 'false');
        await infoPanelToggle.click();
    }

    await expect(infoPanel).toBeVisible();
    await expect(weatherForecastSection).toBeVisible();
    await expect(infoPanel.getByRole('heading', { name: 'Weather Forecast', exact: true })).toBeVisible();
    await expect(infoPanel.getByText('Click on the map to load a forecast.')).toBeVisible();

    const initialHighlightedCoordinate = await getHighlightedCoordinate(page);

    const mapBox = await mapContainer.boundingBox();
    expect(mapBox).not.toBeNull();

    await mapContainer.click({
        position: {
            x: Math.round(mapBox!.width * 0.6),
            y: Math.round(mapBox!.height * 0.5)
        }
    });

    await expect.poll(async () => {
        const highlightedCoordinate = await getHighlightedCoordinate(page);
        if (!highlightedCoordinate) {
            return false;
        }

        if (!initialHighlightedCoordinate) {
            return true;
        }

        return (
            highlightedCoordinate[0] !== initialHighlightedCoordinate[0] ||
            highlightedCoordinate[1] !== initialHighlightedCoordinate[1]
        );
    }).toBe(true);

    await expect(weatherForecast).toBeVisible();
    await expect(infoPanel.getByText(/^Location:/)).toBeVisible();
    await expect.poll(() => forecastEntries.count()).toBe(24);
});
