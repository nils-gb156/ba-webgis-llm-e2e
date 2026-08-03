// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle, getMapCenter, isLayerRendered } from '../../../map-model-helpers';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const mapContainer = page.getByTestId('map-container');
    const layerSwitcher = page.getByTestId('layer-switcher');
    const infoPanel = page.getByTestId('info-panel');
    const measurementPanel = page.getByTestId('measurement-panel');
    const geocoderInput = page.getByTestId('geocoder-input');
    const geocoderResults = page.getByTestId('geocoder-results');
    const firstGeocoderResult = page.getByTestId('geocoder-result-item-0');
    const weatherForecastSection = page.getByTestId('weather-forecast-section');

    await expect(mapContainer).toBeVisible();
    await expect(layerSwitcher).toBeVisible();
    await expect(infoPanel).toBeVisible();
    await expect(measurementPanel).not.toBeVisible();
    await expect(geocoderInput).toBeVisible();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(false);

    const temperatureToggle = layerSwitcher.getByLabel('Temperature');
    const precipitationToggle = layerSwitcher.getByLabel('Precipitation');

    await expect(temperatureToggle).toBeChecked();
    await expect(precipitationToggle).not.toBeChecked();

    await temperatureToggle.uncheck({ force: true });
    await expect(temperatureToggle).not.toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);

    await precipitationToggle.check({ force: true });
    await expect(precipitationToggle).toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

    await expect.poll(async () => {
        const center = await getMapCenter(page);
        return center?.join(',');
    }).not.toBeUndefined();

    const centerBeforeSelection = await getMapCenter(page);
    if (!centerBeforeSelection) {
        throw new Error('Map center was not available before selecting a geocoder result.');
    }
    const centerBeforeSelectionKey = centerBeforeSelection.join(',');

    await geocoderInput.click();
    await page.keyboard.press('ControlOrMeta+A');
    await page.keyboard.press('Delete');
    await page.keyboard.insertText('Münster');

    await expect(geocoderResults).toBeVisible();
    await expect(firstGeocoderResult).toBeVisible();
    await firstGeocoderResult.click();

    await expect.poll(async () => {
        const center = await getMapCenter(page);
        return center?.join(',');
    }).not.toBe(centerBeforeSelectionKey);

    await expect(weatherForecastSection).toBeVisible();
    await expect(weatherForecastSection.getByTestId('weather-forecast-entry')).toHaveCount(24);

    await expect(temperatureToggle).not.toBeChecked();
    await expect(precipitationToggle).toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);
});
