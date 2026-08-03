// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle, getMapCenter, isLayerRendered } from '../../../map-model-helpers';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
    await page.waitForLoadState('networkidle');

    const layerSwitcher = page.getByTestId('layer-switcher');
    const infoPanel = page.getByTestId('info-panel');
    const geocoderInput = page.getByTestId('geocoder-input');
    const geocoderResults = page.getByTestId('geocoder-results');
    const firstGeocoderResult = page.getByTestId('geocoder-result-item-0');
    const measurementPanel = page.getByTestId('measurement-panel');

    const temperatureToggle = layerSwitcher
        .getByRole('checkbox', { name: 'Temperature', exact: true })
        .or(layerSwitcher.getByRole('switch', { name: 'Temperature', exact: true }));
    const precipitationToggle = layerSwitcher
        .getByRole('checkbox', { name: 'Precipitation', exact: true })
        .or(layerSwitcher.getByRole('switch', { name: 'Precipitation', exact: true }));

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect(layerSwitcher).toBeVisible();
    await expect(infoPanel).toBeVisible();
    await expect(geocoderInput).toBeVisible();
    await expect(measurementPanel).toBeHidden();

    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(false);
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

    await expect.poll(async () => (await getMapCenter(page)) !== undefined).toBe(true);
    const initialCenter = await getMapCenter(page);
    if (!initialCenter) {
        throw new Error('Map center was not available before starting the geocoder search.');
    }

    await geocoderInput.click();
    await geocoderInput.fill('Münster');

    await expect(geocoderResults).toBeVisible();
    await expect(firstGeocoderResult).toBeVisible();
    await firstGeocoderResult.click();

    await expect.poll(async () => {
        const center = await getMapCenter(page);
        if (!center) {
            return false;
        }
        const dx = Math.abs(center[0] - initialCenter[0]);
        const dy = Math.abs(center[1] - initialCenter[1]);
        return dx > 1000 || dy > 1000;
    }).toBe(true);

    const weatherForecastSection = infoPanel.getByTestId('weather-forecast-section');
    const weatherForecastEntries = infoPanel.getByTestId('weather-forecast-entry');

    await expect(weatherForecastSection).toBeVisible();
    await expect(weatherForecastEntries).toHaveCount(24);
});
