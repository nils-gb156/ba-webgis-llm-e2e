// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapCenter, getHighlightedCoordinate, isLayerRendered } from '../../../map-model-helpers';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const mapContainer = page.getByTestId('map-container');
    const layerSwitcher = page.getByTestId('layer-switcher');
    const infoPanel = page.getByTestId('info-panel');
    const geocoderInput = page.getByTestId('geocoder-input');
    const measurementPanel = page.getByTestId('measurement-panel');

    await expect(mapContainer).toBeVisible();
    await expect(layerSwitcher).toBeVisible();
    await expect(infoPanel).toBeVisible();
    await expect(geocoderInput).toBeVisible();
    await expect(measurementPanel).toBeHidden();

    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(false);
    await expect.poll(() => getMapCenter(page)).not.toBeUndefined();

    const temperatureToggle = layerSwitcher.getByRole('checkbox', { name: 'Temperature', exact: true });
    const precipitationToggle = layerSwitcher.getByRole('checkbox', { name: 'Precipitation', exact: true });

    await expect(temperatureToggle).toBeChecked();
    await expect(precipitationToggle).not.toBeChecked();

    await temperatureToggle.click({ force: true });
    await precipitationToggle.click({ force: true });

    await expect(temperatureToggle).not.toBeChecked();
    await expect(precipitationToggle).toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

    const initialCenter = await getMapCenter(page);
    if (!initialCenter) {
        throw new Error('Map center was not available after the map became ready.');
    }

    await geocoderInput.click();
    await page.keyboard.type('Münster');

    const geocoderResults = page.getByTestId('geocoder-results');
    const firstResult = page.getByTestId('geocoder-result-item-0');

    await expect(geocoderResults).toBeVisible();
    await expect(firstResult).toBeVisible();
    await firstResult.click();

    await expect.poll(async () => {
        const center = await getMapCenter(page);
        if (!center) {
            return 0;
        }
        return Math.hypot(center[0] - initialCenter[0], center[1] - initialCenter[1]);
    }).toBeGreaterThan(1000);

    await expect.poll(() => getHighlightedCoordinate(page)).not.toBeUndefined();

    const weatherForecastSection = infoPanel.getByTestId('weather-forecast-section');
    await expect(weatherForecastSection).toBeVisible();
    await expect(weatherForecastSection.getByTestId('weather-forecast-entry')).toHaveCount(24);
});
