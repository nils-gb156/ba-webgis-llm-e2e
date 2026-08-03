// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapCenter, getHighlightedCoordinate, isLayerRendered } from '../../../map-model-helpers';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const layerSwitcher = page.getByTestId('layer-switcher');
    const infoPanel = page.getByTestId('info-panel');
    const measurementPanel = page.getByTestId('measurement-panel');
    const geocoderInput = page.getByTestId('geocoder-input');
    const geocoderResults = page.getByTestId('geocoder-results');
    const firstGeocoderResult = page.getByTestId('geocoder-result-item-0');
    const weatherForecastSection = page.getByTestId('weather-forecast-section');
    const weatherForecastEntries = page.getByTestId('weather-forecast-entry');

    await expect(layerSwitcher).toBeVisible();
    await expect(infoPanel).toBeVisible();
    await expect(measurementPanel).toBeHidden();
    await expect(geocoderInput).toBeVisible();

    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(false);

    const temperatureLayerToggle = layerSwitcher.getByRole('checkbox', {
        name: 'Temperature',
        exact: true
    });
    const precipitationLayerToggle = layerSwitcher.getByRole('checkbox', {
        name: 'Precipitation',
        exact: true
    });

    await expect(temperatureLayerToggle).toBeChecked();
    await expect(precipitationLayerToggle).not.toBeChecked();

    await temperatureLayerToggle.click({ force: true });
    await expect(temperatureLayerToggle).not.toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);

    await precipitationLayerToggle.click({ force: true });
    await expect(precipitationLayerToggle).toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

    await expect.poll(() => getMapCenter(page)).not.toBeUndefined();
    const initialCenter = await getMapCenter(page);
    if (!initialCenter) {
        throw new Error('Map center was not available after initial map load.');
    }
    const initialCenterKey = `${Math.round(initialCenter[0])},${Math.round(initialCenter[1])}`;

    await geocoderInput.click();
    await page.keyboard.type('Münster');

    await expect(geocoderResults).toBeVisible();
    await expect(firstGeocoderResult).toBeVisible();

    await firstGeocoderResult.click();

    await expect.poll(async () => {
        const center = await getMapCenter(page);
        return center ? `${Math.round(center[0])},${Math.round(center[1])}` : undefined;
    }).not.toBe(initialCenterKey);

    await expect.poll(() => getHighlightedCoordinate(page)).not.toBeUndefined();

    await expect(weatherForecastSection).toBeVisible();
    await expect(weatherForecastEntries).toHaveCount(24);
});
