// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle, getMapCenter, isLayerRendered } from "../../../map-model-helpers";

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const layerSwitcher = page.getByTestId('layer-switcher');
    const infoPanel = page.getByTestId('info-panel');
    const geocoderInput = page.getByTestId('geocoder-input');
    const forecastSection = page.getByTestId('weather-forecast-section');

    await expect(page.getByTestId('map-container')).toBeVisible();
    await expect(layerSwitcher).toBeVisible();
    await expect(infoPanel).toBeVisible();
    await expect(geocoderInput).toBeVisible();
    await expect(page.getByTestId('measurement-panel')).toBeHidden();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(false);
    await expect.poll(() => getMapCenter(page)).toBeDefined();

    const temperatureToggle = layerSwitcher
        .getByRole('checkbox', { name: 'Temperature', exact: true })
        .or(layerSwitcher.getByRole('switch', { name: 'Temperature', exact: true }));
    const precipitationToggle = layerSwitcher
        .getByRole('checkbox', { name: 'Precipitation', exact: true })
        .or(layerSwitcher.getByRole('switch', { name: 'Precipitation', exact: true }));

    await expect(temperatureToggle).toBeChecked();
    await expect(precipitationToggle).not.toBeChecked();

    await temperatureToggle.click({ force: true });
    await expect(temperatureToggle).not.toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);

    await precipitationToggle.click({ force: true });
    await expect(precipitationToggle).toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

    const initialCenter = await getMapCenter(page);
    expect(initialCenter).toBeDefined();

    await geocoderInput.click();
    await geocoderInput.fill('Münster');

    const geocoderResults = page.getByTestId('geocoder-results');
    const firstResult = page.getByTestId('geocoder-result-item-0');

    await expect(geocoderResults).toBeVisible();
    await expect(firstResult).toBeVisible();
    await firstResult.click();

    await expect.poll(async () => {
        const currentCenter = await getMapCenter(page);
        if (!initialCenter || !currentCenter) {
            return false;
        }

        return (
            Math.abs(currentCenter[0] - initialCenter[0]) > 1 ||
            Math.abs(currentCenter[1] - initialCenter[1]) > 1
        );
    }).toBe(true);

    await expect(forecastSection).toBeVisible();
    await expect(forecastSection.getByTestId('weather-forecast-entry')).toHaveCount(24);
});
