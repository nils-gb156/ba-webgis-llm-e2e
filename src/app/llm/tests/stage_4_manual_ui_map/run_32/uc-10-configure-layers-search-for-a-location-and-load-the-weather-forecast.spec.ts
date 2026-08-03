// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapCenter, getHighlightedCoordinate, isLayerRendered } from "../../../map-model-helpers";

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    await expect(page.getByTestId('map-container')).toBeVisible();
    await expect(page.getByTestId('layer-switcher')).toBeVisible();
    await expect(page.getByTestId('info-panel')).toBeVisible();
    await expect(page.getByTestId('measurement-panel')).toBeHidden();
    await expect(page.getByTestId('geocoder-input')).toBeVisible();

    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(false);
    await expect.poll(() => getMapCenter(page)).not.toBeUndefined();

    const layerSwitcher = page.getByTestId('layer-switcher');
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

    const initialCenter = await getMapCenter(page);
    if (!initialCenter) {
        throw new Error('Map center was not available after the map became ready.');
    }

    const geocoderInput = page.getByTestId('geocoder-input');
    await geocoderInput.click();
    await geocoderInput.fill('Münster');

    await expect(page.getByTestId('geocoder-clear-button')).toBeVisible();

    const geocoderResults = page.getByTestId('geocoder-results');
    await expect(geocoderResults).toBeVisible();

    const firstResult = geocoderResults.getByRole('listitem').first();
    await expect(firstResult).toBeVisible();
    await firstResult.click();

    await expect.poll(async () => {
        const center = await getMapCenter(page);
        if (!center) {
            return false;
        }
        return center[0] !== initialCenter[0] || center[1] !== initialCenter[1];
    }).toBe(true);

    await expect.poll(() => getHighlightedCoordinate(page)).not.toBeUndefined();

    await expect(page.getByTestId('weather-forecast-section')).toBeVisible();
    const weatherForecast = page.getByTestId('weather-forecast');
    await expect(weatherForecast).toBeVisible();
    await expect(weatherForecast.getByTestId('weather-forecast-entry')).toHaveCount(24);
});
