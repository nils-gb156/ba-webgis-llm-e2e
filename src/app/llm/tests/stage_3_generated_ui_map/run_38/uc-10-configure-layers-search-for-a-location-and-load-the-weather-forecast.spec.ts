// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import {
    getMapCenter,
    getMapZoomLevel,
    isLayerRendered
} from '../../../map-model-helpers';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({
    page
}) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    await expect.poll(async () => (await getMapZoomLevel(page)) !== undefined).toBe(true);
    await expect.poll(async () => (await getMapCenter(page)) !== undefined).toBe(true);

    const layerSwitcher = page.getByTestId('layer-switcher');
    const infoPanel = page.getByTestId('info-panel');
    const geocoderInput = page.getByTestId('geocoder-input');
    const measurementPanel = page.getByTestId('measurement-panel');

    await expect(layerSwitcher).toBeVisible();
    await expect(infoPanel).toBeVisible();
    await expect(geocoderInput).toBeVisible();
    await expect(measurementPanel).toBeHidden();

    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(false);

    const temperatureToggle = layerSwitcher.getByLabel('Temperature', { exact: true });
    const precipitationToggle = layerSwitcher.getByLabel('Precipitation', { exact: true });

    await expect(temperatureToggle).toBeChecked();
    await expect(precipitationToggle).not.toBeChecked();

    const initialCenter = await getMapCenter(page);
    if (!initialCenter) {
        throw new Error('Initial map center is not available.');
    }

    await temperatureToggle.click({ force: true });
    await expect(temperatureToggle).not.toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);

    await precipitationToggle.click({ force: true });
    await expect(precipitationToggle).toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

    await geocoderInput.click();
    await geocoderInput.fill('Münster');

    const geocoderResults = page.getByTestId('geocoder-results');
    const firstResult = page.getByTestId('geocoder-result-item-0');

    await expect(geocoderResults).toBeVisible();
    await expect(firstResult).toBeVisible();
    await firstResult.click();

    await expect.poll(async () => {
        const center = await getMapCenter(page);
        if (!center) {
            return false;
        }

        return (
            Math.abs(center[0] - initialCenter[0]) > 1000 ||
            Math.abs(center[1] - initialCenter[1]) > 1000
        );
    }).toBe(true);

    const weatherForecastSection = page.getByTestId('weather-forecast-section');
    const weatherForecastEntries = page.getByTestId('weather-forecast-entry');

    await expect(infoPanel).toBeVisible();
    await expect(weatherForecastSection).toBeVisible();
    await expect(weatherForecastEntries).toHaveCount(24);
});
