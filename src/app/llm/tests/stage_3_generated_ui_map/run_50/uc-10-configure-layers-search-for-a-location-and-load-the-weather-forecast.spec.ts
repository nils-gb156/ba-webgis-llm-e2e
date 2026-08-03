// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapCenter, isLayerRendered } from '../../../map-model-helpers';

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

    let temperatureToggle = layerSwitcher.getByRole('checkbox', { name: 'Temperature', exact: true });
    if ((await temperatureToggle.count()) === 0) {
        temperatureToggle = layerSwitcher.getByRole('switch', { name: 'Temperature', exact: true });
    }

    let precipitationToggle = layerSwitcher.getByRole('checkbox', { name: 'Precipitation', exact: true });
    if ((await precipitationToggle.count()) === 0) {
        precipitationToggle = layerSwitcher.getByRole('switch', { name: 'Precipitation', exact: true });
    }

    await expect(temperatureToggle).toBeVisible();
    await expect(precipitationToggle).toBeVisible();

    await expect(temperatureToggle).toBeChecked();
    await expect(precipitationToggle).not.toBeChecked();

    if (await temperatureToggle.isChecked()) {
        await temperatureToggle.click({ force: true });
    }
    await expect(temperatureToggle).not.toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);

    if (!(await precipitationToggle.isChecked())) {
        await precipitationToggle.click({ force: true });
    }
    await expect(precipitationToggle).toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

    let initialCenter: [number, number] | undefined;
    await expect
        .poll(async () => {
            initialCenter = await getMapCenter(page);
            return initialCenter;
        })
        .not.toBeUndefined();

    await geocoderInput.click();
    await geocoderInput.fill('Münster');

    await expect(geocoderResults).toBeVisible();
    await expect(firstGeocoderResult).toBeVisible();
    await firstGeocoderResult.click();

    await expect
        .poll(async () => {
            const currentCenter = await getMapCenter(page);
            if (!initialCenter || !currentCenter) {
                return false;
            }

            return currentCenter[0] !== initialCenter[0] || currentCenter[1] !== initialCenter[1];
        })
        .toBe(true);

    await expect(weatherForecastSection).toBeVisible();
    await expect(weatherForecastEntries).toHaveCount(24);

    await expect(temperatureToggle).not.toBeChecked();
    await expect(precipitationToggle).toBeChecked();
});
