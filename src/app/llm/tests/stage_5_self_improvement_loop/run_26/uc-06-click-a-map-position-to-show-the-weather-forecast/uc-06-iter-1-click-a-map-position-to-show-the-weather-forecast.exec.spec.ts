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

    await expect(mapContainer).toBeVisible();

    if (!(await infoPanel.isVisible())) {
        await expect(infoPanelToggle).toHaveAttribute('aria-pressed', 'false');
        await infoPanelToggle.click();
    }

    await expect(infoPanel).toBeVisible();
    await expect(infoPanelToggle).toHaveAttribute('aria-pressed', 'true');
    await expect(weatherForecastSection).toBeVisible();
    await expect(
        weatherForecastSection.getByRole('heading', { name: 'Weather Forecast', exact: true })
    ).toBeVisible();

    await expect.poll(() => getMapZoomLevel(page), { timeout: 15000 }).toBeGreaterThan(0);

    const previousHighlight = await getHighlightedCoordinate(page);

    await mapContainer.click({
        position: {
            x: 750,
            y: 320
        }
    });

    await expect
        .poll(async () => {
            const highlight = await getHighlightedCoordinate(page);
            if (!highlight) {
                return false;
            }

            if (!previousHighlight) {
                return true;
            }

            return highlight[0] !== previousHighlight[0] || highlight[1] !== previousHighlight[1];
        }, { timeout: 15000 })
        .toBe(true);

    const weatherForecast = page.getByTestId('weather-forecast');

    await expect(weatherForecast).toBeVisible();
    await expect(weatherForecastSection).toContainText(/Location:/);
    await expect(weatherForecast.getByTestId('weather-forecast-entry')).toHaveCount(24);
});
