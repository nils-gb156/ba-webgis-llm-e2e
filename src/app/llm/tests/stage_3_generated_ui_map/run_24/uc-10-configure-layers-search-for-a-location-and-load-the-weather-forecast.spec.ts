// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapCenter, isLayerRendered } from "../../../map-model-helpers";

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const layerSwitcher = page.getByTestId('layer-switcher');
    const infoPanel = page.getByTestId('info-panel');
    const geocoderInput = page.getByTestId('geocoder-input');
    const geocoderResults = page.getByTestId('geocoder-results');
    const measurementPanel = page.getByTestId('measurement-panel');
    const forecastSection = page.getByTestId('weather-forecast-section');

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

    await temperatureToggle.click({ force: true });
    await expect(temperatureToggle).not.toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);

    await precipitationToggle.click({ force: true });
    await expect(precipitationToggle).toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

    await expect.poll(async () => (await getMapCenter(page)) !== undefined).toBe(true);
    const centerBeforeSelection = await getMapCenter(page);
    if (!centerBeforeSelection) {
        throw new Error('Map center was not available before selecting a geocoder result.');
    }

    await geocoderInput.click();
    await geocoderInput.fill('Münster');

    await expect(geocoderResults).toBeVisible();
    const firstResult = page.getByTestId('geocoder-result-item-0');
    await expect(firstResult).toBeVisible();
    await firstResult.click();

    await expect.poll(async () => {
        const center = await getMapCenter(page);
        if (!center) {
            return false;
        }
        return (
            Math.abs(center[0] - centerBeforeSelection[0]) > 10 ||
            Math.abs(center[1] - centerBeforeSelection[1]) > 10
        );
    }).toBe(true);

    await expect(forecastSection).toBeVisible();
    await expect(forecastSection.getByTestId('weather-forecast-entry')).toHaveCount(24);
});
