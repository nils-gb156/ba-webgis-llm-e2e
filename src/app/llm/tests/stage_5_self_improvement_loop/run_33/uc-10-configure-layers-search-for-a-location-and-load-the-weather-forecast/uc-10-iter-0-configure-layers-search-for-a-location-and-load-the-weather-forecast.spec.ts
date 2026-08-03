// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapCenter, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const layerSwitcher = page.getByTestId('layer-switcher');
    const infoPanel = page.getByTestId('info-panel');
    const weatherForecastSection = page.getByTestId('weather-forecast-section');
    const geocoderPanel = page.getByTestId('geocoder-panel');
    const geocoderInput = page.getByRole('textbox', { name: 'Geocoder search', exact: true });
    const measurementToggle = page.getByTestId('measurement-toggle');

    await expect(layerSwitcher).toBeVisible();
    await expect(infoPanel).toBeVisible();
    await expect(weatherForecastSection).toBeVisible();
    await expect(geocoderPanel).toBeVisible();
    await expect(geocoderInput).toBeVisible();
    await expect(geocoderInput).toBeEnabled();
    await expect(measurementToggle).toBeVisible();
    await expect(measurementToggle).not.toHaveAttribute('aria-pressed', 'true');

    const temperatureLayerToggle = page.getByRole('checkbox', { name: 'Temperature', exact: true });
    const precipitationLayerToggle = page.getByRole('checkbox', { name: 'Precipitation', exact: true });

    await expect(temperatureLayerToggle).toBeChecked();
    await expect(precipitationLayerToggle).not.toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(false);

    await temperatureLayerToggle.click({ force: true });
    await expect(temperatureLayerToggle).not.toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);

    await precipitationLayerToggle.click({ force: true });
    await expect(precipitationLayerToggle).toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

    let initialCenter: [number, number] | undefined;
    await expect.poll(async () => {
        initialCenter = await getMapCenter(page);
        return initialCenter;
    }).toBeDefined();

    await geocoderInput.click();
    await geocoderInput.fill('Münster');

    const firstSearchResult = geocoderPanel.getByText(/Münster/i).first();
    await expect(firstSearchResult).toBeVisible();
    await firstSearchResult.click();

    await expect.poll(async () => {
        const currentCenter = await getMapCenter(page);
        if (!initialCenter || !currentCenter) {
            return 0;
        }

        return Math.hypot(currentCenter[0] - initialCenter[0], currentCenter[1] - initialCenter[1]);
    }).toBeGreaterThan(10000);

    await expect(weatherForecastSection).toBeVisible();
    await expect(weatherForecastSection).not.toContainText('Click on the map to load a forecast.');

    await expect.poll(async () => {
        const listItemCount = await weatherForecastSection.getByRole('listitem').count();
        const text = await weatherForecastSection.innerText();
        const timeLabelCount = text.match(/\b\d{1,2}:\d{2}\b/g)?.length ?? 0;
        const temperatureValueCount = text.match(/-?\d+(?:[.,]\d+)?\s*°C/g)?.length ?? 0;

        return Math.max(listItemCount, timeLabelCount, temperatureValueCount);
    }).toBe(24);
});
