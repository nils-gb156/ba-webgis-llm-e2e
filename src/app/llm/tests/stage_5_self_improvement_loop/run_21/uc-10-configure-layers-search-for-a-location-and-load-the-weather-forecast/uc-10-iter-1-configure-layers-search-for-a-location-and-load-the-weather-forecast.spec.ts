// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import {
    getHighlightedCoordinate,
    getMapCenter,
    getMapZoomLevel,
    isLayerRendered
} from '../../../../map-model-helpers';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({
    page
}) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const layerSwitcher = page.getByTestId('layer-switcher');
    const layerSwitcherToggle = page.getByTestId('layer-switcher-toggle');
    const infoPanel = page.getByTestId('info-panel');
    const infoPanelToggle = page.getByTestId('info-panel-toggle');
    const geocoderPanel = page.getByTestId('geocoder-panel');
    const geocoderInput = page.getByTestId('geocoder-input');
    const weatherForecastSection = page.getByTestId('weather-forecast-section');
    const weatherForecastEntries = page.getByTestId('weather-forecast-entry');
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
    await expect(layerSwitcherToggle).toHaveAttribute('aria-pressed', 'true');
    await expect(infoPanel).toBeVisible();
    await expect(infoPanelToggle).toHaveAttribute('aria-pressed', 'true');
    await expect(geocoderPanel).toBeVisible();
    await expect(geocoderInput).toBeVisible();
    await expect(weatherForecastSection).toBeVisible();
    await expect(measurementToggle).not.toHaveAttribute('aria-pressed', 'true');

    await expect.poll(() => getMapZoomLevel(page)).not.toBeUndefined();
    await expect.poll(() => getMapCenter(page)).not.toBeUndefined();
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(false);

    await expect(temperatureCheckbox).toBeChecked();
    await expect(precipitationCheckbox).not.toBeChecked();

    const initialCenter = (await getMapCenter(page))!;
    const initialZoom = (await getMapZoomLevel(page))!;

    await temperatureCheckbox.click({ force: true });
    await expect(temperatureCheckbox).not.toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);

    await precipitationCheckbox.click({ force: true });
    await expect(precipitationCheckbox).toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

    await geocoderInput.click();
    await geocoderInput.fill('Münster');

    const firstSearchResult = geocoderPanel.getByText(/Münster/i).first();
    await expect(firstSearchResult).toBeVisible();
    await firstSearchResult.click();

    await expect
        .poll(async () => {
            const center = await getMapCenter(page);
            return (
                !!center &&
                center[0] > 700000 &&
                center[0] < 1000000 &&
                center[1] > 6600000 &&
                center[1] < 7000000
            );
        })
        .toBe(true);

    await expect
        .poll(async () => {
            const center = await getMapCenter(page);
            return !!center && (center[0] !== initialCenter[0] || center[1] !== initialCenter[1]);
        })
        .toBe(true);

    await expect.poll(() => getMapZoomLevel(page)).toBeGreaterThan(initialZoom);

    await expect
        .poll(async () => {
            const highlightedCoordinate = await getHighlightedCoordinate(page);
            return (
                !!highlightedCoordinate &&
                highlightedCoordinate[0] > 700000 &&
                highlightedCoordinate[0] < 1000000 &&
                highlightedCoordinate[1] > 6600000 &&
                highlightedCoordinate[1] < 7000000
            );
        })
        .toBe(true);

    await expect(infoPanel).not.toContainText('Click on the map to load a forecast.');
    await expect(infoPanel).toContainText(/Location:\s*Münster,\s*DE/i);
    await expect(weatherForecastSection).toBeVisible();
    await expect(weatherForecastEntries).toHaveCount(24);
});
