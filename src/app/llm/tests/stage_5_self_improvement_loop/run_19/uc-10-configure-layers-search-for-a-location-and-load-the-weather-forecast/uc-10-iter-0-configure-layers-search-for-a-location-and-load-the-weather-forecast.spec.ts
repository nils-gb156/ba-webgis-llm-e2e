// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import {
    getActiveBaseLayerTitle,
    getMapCenter,
    isLayerRendered
} from '../../../../map-model-helpers';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({
    page
}) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const layerSwitcher = page.getByTestId('layer-switcher');
    const infoPanel = page.getByTestId('info-panel');
    const weatherForecastSection = page.getByTestId('weather-forecast-section');
    const geocoderPanel = page.getByTestId('geocoder-panel');
    const geocoderInput = geocoderPanel.getByRole('textbox', {
        name: 'Geocoder search',
        exact: true
    });
    const measurementToggle = page.getByTestId('measurement-toggle');

    const temperatureCheckbox = layerSwitcher.getByRole('checkbox', {
        name: 'Temperature',
        exact: true
    });
    const precipitationCheckbox = layerSwitcher.getByRole('checkbox', {
        name: 'Precipitation',
        exact: true
    });

    await expect(layerSwitcher).toBeVisible();
    await expect(infoPanel).toBeVisible();
    await expect(geocoderPanel).toBeVisible();
    await expect(geocoderInput).toBeVisible();
    await expect(measurementToggle).not.toHaveAttribute('aria-pressed', 'true');

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(false);
    await expect(temperatureCheckbox).toBeChecked();
    await expect(precipitationCheckbox).not.toBeChecked();

    await expect(weatherForecastSection.getByText('Click on the map to load a forecast.')).toBeVisible();

    await expect.poll(() => getMapCenter(page)).not.toBeUndefined();
    const initialCenter = await getMapCenter(page);
    if (!initialCenter) {
        throw new Error('Expected map center to be available after initial load.');
    }

    await temperatureCheckbox.click({ force: true });
    await expect(temperatureCheckbox).not.toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);

    await precipitationCheckbox.click({ force: true });
    await expect(precipitationCheckbox).toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

    await geocoderInput.click();
    await geocoderInput.fill('Münster');

    await expect
        .poll(async () => (await page.locator('body').textContent()) ?? '')
        .toMatch(/münster/i);

    const firstSearchResult = page.getByText(/münster/i).first();
    await expect(firstSearchResult).toBeVisible();
    await firstSearchResult.click();

    await expect(geocoderInput).toHaveValue(/münster/i);
    await expect.poll(() => getMapCenter(page)).not.toEqual(initialCenter);

    await expect(weatherForecastSection.getByText('Click on the map to load a forecast.')).toBeHidden();
    await expect(weatherForecastSection.getByRole('listitem')).toHaveCount(24);
});
