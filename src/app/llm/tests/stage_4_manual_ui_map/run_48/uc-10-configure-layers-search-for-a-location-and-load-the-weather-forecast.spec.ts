// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapCenter, isLayerRendered } from '../../../map-model-helpers';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    await expect(page.getByTestId('map-container')).toBeVisible();
    await expect(page.getByTestId('layer-switcher')).toBeVisible();
    await expect(page.getByTestId('info-panel')).toBeVisible();
    await expect(page.getByTestId('geocoder-input')).toBeVisible();
    await expect(page.getByTestId('measurement-panel')).toBeHidden();

    await expect.poll(() => getMapCenter(page)).toBeTruthy();
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(false);

    const layerSwitcher = page.getByTestId('layer-switcher');
    const temperatureToggle = layerSwitcher.getByRole('checkbox', { name: 'Temperature', exact: true });
    const precipitationToggle = layerSwitcher.getByRole('checkbox', { name: 'Precipitation', exact: true });

    await expect(temperatureToggle).toBeChecked();
    await expect(precipitationToggle).not.toBeChecked();

    await temperatureToggle.click({ force: true });
    await expect(temperatureToggle).not.toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);

    await precipitationToggle.click({ force: true });
    await expect(precipitationToggle).toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

    const centerBeforeSearch = await getMapCenter(page);
    if (!centerBeforeSearch) {
        throw new Error('Map center was not available after the map became ready.');
    }
    const centerBeforeSearchKey = JSON.stringify(centerBeforeSearch.map((value) => Math.round(value)));

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
        return center ? JSON.stringify(center.map((value) => Math.round(value))) : undefined;
    }).not.toBe(centerBeforeSearchKey);

    await expect(page.getByTestId('weather-forecast')).toBeVisible();
    await expect(page.getByTestId('weather-forecast-entry')).toHaveCount(24);
});
