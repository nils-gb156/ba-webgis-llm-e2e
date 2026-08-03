// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapCenter, getHighlightedCoordinate, isLayerRendered } from '../../../map-model-helpers';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const mapContainer = page.getByTestId('map-container');
    const layerSwitcher = page.getByTestId('layer-switcher');
    const infoPanel = page.getByTestId('info-panel');
    const measurementPanel = page.getByTestId('measurement-panel');
    const geocoderInput = page.getByTestId('geocoder-input');
    const geocoderResults = page.getByTestId('geocoder-results');

    await expect(mapContainer).toBeVisible();

    if (!(await layerSwitcher.isVisible())) {
        const layerSwitcherToggle = page.getByTestId('layer-switcher-toggle');
        if ((await layerSwitcherToggle.getAttribute('aria-pressed')) !== 'true') {
            await layerSwitcherToggle.click();
        }
    }
    await expect(layerSwitcher).toBeVisible();

    if (!(await infoPanel.isVisible())) {
        const infoPanelToggle = page.getByTestId('info-panel-toggle');
        if ((await infoPanelToggle.getAttribute('aria-pressed')) !== 'true') {
            await infoPanelToggle.click();
        }
    }
    await expect(infoPanel).toBeVisible();

    await expect(measurementPanel).toBeHidden();
    await expect(geocoderInput).toBeVisible();

    let initialCenter: [number, number] | undefined;
    await expect.poll(async () => {
        initialCenter = await getMapCenter(page);
        return initialCenter !== undefined;
    }).toBe(true);

    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(false);

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

    await geocoderInput.click();
    await geocoderInput.fill('Münster');

    await expect(geocoderResults).toBeVisible();
    const firstResult = geocoderResults.getByRole('listitem').first();
    await expect(firstResult).toBeVisible();
    await firstResult.click();

    await expect.poll(async () => {
        const highlight = await getHighlightedCoordinate(page);
        return highlight !== undefined;
    }).toBe(true);

    await expect.poll(async () => {
        const center = await getMapCenter(page);
        if (!center || !initialCenter) {
            return false;
        }

        return (
            Math.abs(center[0] - initialCenter[0]) > 1000 ||
            Math.abs(center[1] - initialCenter[1]) > 1000
        );
    }).toBe(true);

    await expect.poll(async () => {
        const center = await getMapCenter(page);
        const highlight = await getHighlightedCoordinate(page);

        if (!center || !highlight) {
            return false;
        }

        return Math.abs(center[0] - highlight[0]) < 5000 && Math.abs(center[1] - highlight[1]) < 5000;
    }).toBe(true);

    const weatherForecast = infoPanel.getByTestId('weather-forecast');
    await expect(weatherForecast).toBeVisible();
    await expect.poll(() => weatherForecast.getByTestId('weather-forecast-entry').count()).toBe(24);
});
