// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import {
    getActiveBaseLayerTitle,
    getMapCenter,
    isLayerRendered
} from '../../../map-model-helpers';

test('UC10 Configure layers, search for a location and load the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');

    const layerSwitcher = page.getByTestId('layer-switcher');
    const infoPanel = page.getByTestId('info-panel');
    const measurementPanel = page.getByTestId('measurement-panel');
    const geocoder = page.getByTestId('geocoder-input');
    const temperatureToggle = layerSwitcher.getByRole('checkbox', {
        name: 'Temperature',
        exact: true
    });
    const precipitationToggle = layerSwitcher.getByRole('checkbox', {
        name: 'Precipitation',
        exact: true
    });

    await expect(layerSwitcher).toBeVisible();
    await expect(infoPanel).toBeVisible();
    await expect(measurementPanel).toBeHidden();
    await expect(geocoder).toBeVisible();

    await expect(temperatureToggle).toBeChecked();
    await expect(precipitationToggle).not.toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(false);

    await temperatureToggle.click({ force: true });
    await expect(temperatureToggle).not.toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);

    await precipitationToggle.click({ force: true });
    await expect(precipitationToggle).toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

    await expect.poll(() => getMapCenter(page)).not.toBeUndefined();
    const initialCenter = await getMapCenter(page);
    expect(initialCenter).toBeTruthy();

    await geocoder.click();
    await page.keyboard.insertText('Münster');

    const geocoderResults = page.getByTestId('geocoder-results');
    const firstResult = page.getByTestId('geocoder-result-item-0');

    await expect(geocoderResults).toBeVisible();
    await expect(firstResult).toBeVisible();
    await firstResult.click();

    await expect
        .poll(async () => {
            const center = await getMapCenter(page);
            if (!center || !initialCenter) {
                return 0;
            }
            const dx = Math.abs(center[0] - initialCenter[0]);
            const dy = Math.abs(center[1] - initialCenter[1]);
            return Math.max(dx, dy);
        })
        .toBeGreaterThan(1000);

    const forecastSection = infoPanel.getByTestId('weather-forecast-section');
    const forecastEntries = forecastSection.getByTestId('weather-forecast-entry');

    await expect(forecastSection).toBeVisible();
    await expect(forecastEntries).toHaveCount(24);

    await expect(temperatureToggle).not.toBeChecked();
    await expect(precipitationToggle).toBeChecked();
});
