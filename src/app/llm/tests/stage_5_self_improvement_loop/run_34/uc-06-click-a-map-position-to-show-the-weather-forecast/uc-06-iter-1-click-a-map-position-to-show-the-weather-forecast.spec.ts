// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getHighlightedCoordinate, getMapCenter } from '../../../../map-model-helpers';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const mapContainer = page.getByTestId('map-container');
    const infoPanel = page.getByTestId('info-panel');
    const infoPanelToggle = page.getByTestId('info-panel-toggle');
    const forecastSection = page.getByTestId('weather-forecast-section');
    const forecast = page.getByTestId('weather-forecast');
    const forecastEntries = page.getByTestId('weather-forecast-entry');

    await expect(mapContainer).toBeVisible();

    if (!(await infoPanel.isVisible())) {
        await infoPanelToggle.click();
    }

    await expect(infoPanel).toBeVisible();
    await expect(infoPanelToggle).toHaveAttribute('aria-pressed', 'true');
    await expect(forecastSection).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Weather Forecast', exact: true })).toBeVisible();
    await expect(page.getByText('Click on the map to load a forecast.', { exact: true })).toBeVisible();
    await expect(forecast).toHaveCount(0);
    await expect(forecastEntries).toHaveCount(0);

    await expect.poll(() => getMapCenter(page)).not.toBeUndefined();

    const highlightedBeforeClick = await getHighlightedCoordinate(page);

    await mapContainer.click({
        position: {
            x: 750,
            y: 315
        }
    });

    await expect
        .poll(async () => {
            const coordinate = await getHighlightedCoordinate(page);
            if (!coordinate) {
                return false;
            }

            if (!highlightedBeforeClick) {
                return true;
            }

            return (
                coordinate[0] !== highlightedBeforeClick[0] ||
                coordinate[1] !== highlightedBeforeClick[1]
            );
        })
        .toBe(true);

    await expect(forecastSection).toBeVisible();
    await expect(forecast).toBeVisible();
    await expect(forecastEntries).toHaveCount(24);
});
