// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import {
    getActiveBaseLayerTitle,
    getMapCenter,
    getHighlightedCoordinate,
    isLayerRendered
} from '../../../map-model-helpers';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({
    page
}) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const mapContainer = page.getByTestId('map-container');
    const layerSwitcher = page.getByTestId('layer-switcher');
    const geocoderInput = page.getByTestId('geocoder-input');
    const geocoderResults = page.getByTestId('geocoder-results');
    const geocoderClearButton = page.getByTestId('geocoder-clear-button');
    const infoPanel = page.getByTestId('info-panel');
    const measurementPanel = page.getByTestId('measurement-panel');
    const weatherForecast = page.getByTestId('weather-forecast');
    const forecastEntries = infoPanel.getByTestId('weather-forecast-entry');

    await expect(mapContainer).toBeVisible();
    await expect(layerSwitcher).toBeVisible();
    await expect(geocoderInput).toBeVisible();
    await expect(infoPanel).toBeVisible();
    await expect(measurementPanel).toBeHidden();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(false);

    const temperatureToggle = layerSwitcher.getByRole('checkbox', {
        name: 'Temperature',
        exact: true
    });
    const precipitationToggle = layerSwitcher.getByRole('checkbox', {
        name: 'Precipitation',
        exact: true
    });

    await expect(temperatureToggle).toBeChecked();
    await expect(precipitationToggle).not.toBeChecked();

    await expect
        .poll(async () => {
            const center = await getMapCenter(page);
            return Array.isArray(center) && center.length === 2;
        })
        .toBe(true);
    const initialCenter = (await getMapCenter(page)) as [number, number];

    await temperatureToggle.click({ force: true });
    await expect(temperatureToggle).not.toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);

    await precipitationToggle.click({ force: true });
    await expect(precipitationToggle).toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

    await geocoderInput.click();
    await geocoderInput.fill('Münster');
    await expect(geocoderInput).toHaveValue('Münster');
    await expect(geocoderClearButton).toBeVisible();

    await expect(geocoderResults).toBeVisible();
    const firstResult = geocoderResults.getByRole('listitem').first();
    await expect(firstResult).toBeVisible();
    await firstResult.click();

    await expect
        .poll(async () => {
            const center = await getMapCenter(page);
            if (!center) {
                return false;
            }

            return (
                Math.abs(center[0] - initialCenter[0]) > 1 ||
                Math.abs(center[1] - initialCenter[1]) > 1
            );
        })
        .toBe(true);

    await expect
        .poll(async () => {
            const highlightedCoordinate = await getHighlightedCoordinate(page);
            return Array.isArray(highlightedCoordinate) && highlightedCoordinate.length === 2;
        })
        .toBe(true);

    await expect(weatherForecast).toBeVisible();
    await expect(forecastEntries).toHaveCount(24);
});
