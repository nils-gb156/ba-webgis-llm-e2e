// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getHighlightedCoordinate, getMapCenter, isLayerRendered } from '../../../../map-model-helpers';

test('UC10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const layerSwitcher = page.getByTestId('layer-switcher');
    const infoPanel = page.getByTestId('info-panel');
    const geocoderPanel = page.getByTestId('geocoder-panel');
    const geocoderInput = page.getByTestId('geocoder-input');
    const measurementToggle = page.getByTestId('measurement-toggle');
    const weatherForecastSection = page.getByTestId('weather-forecast-section');
    const initialForecastMessage = weatherForecastSection.getByText('Click on the map to load a forecast.', {
        exact: true
    });

    await expect(layerSwitcher).toBeVisible();
    await expect(infoPanel).toBeVisible();
    await expect(geocoderPanel).toBeVisible();
    await expect(geocoderInput).toBeVisible();
    await expect(measurementToggle).toBeVisible();
    await expect(weatherForecastSection).toBeVisible();
    await expect(initialForecastMessage).toBeVisible();
    await expect(measurementToggle).toHaveAttribute('aria-pressed', 'false');

    const temperatureCheckbox = layerSwitcher.getByRole('checkbox', { name: 'Temperature', exact: true });
    const precipitationCheckbox = layerSwitcher.getByRole('checkbox', { name: 'Precipitation', exact: true });
    const temperatureLegend = page.getByTestId('temperature-legend');
    const precipitationLegend = page.getByTestId('precipitation-legend');

    await expect(temperatureCheckbox).toBeChecked();
    await expect(precipitationCheckbox).not.toBeChecked();
    await expect(temperatureLegend).toBeVisible();
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(false);

    await expect.poll(() => getMapCenter(page)).toBeTruthy();
    const initialCenter = await getMapCenter(page);
    expect(initialCenter).toBeDefined();

    await temperatureCheckbox.click({ force: true });
    await expect(temperatureCheckbox).not.toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);
    await expect(temperatureLegend).toBeHidden();

    await precipitationCheckbox.click({ force: true });
    await expect(precipitationCheckbox).toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);
    await expect(precipitationLegend).toBeVisible();

    await geocoderInput.click();
    await geocoderInput.fill('Münster');

    const firstSearchResult = geocoderPanel.getByText(/Münster/i).first();
    await expect(firstSearchResult).toBeVisible();
    await firstSearchResult.click();

    await expect(geocoderInput).toHaveValue(/Münster/i);

    await expect.poll(async () => {
        const center = await getMapCenter(page);
        return (
            !!center &&
            !!initialCenter &&
            Math.hypot(center[0] - initialCenter[0], center[1] - initialCenter[1]) > 50000
        );
    }).toBe(true);

    await expect.poll(async () => {
        const center = await getMapCenter(page);
        return (
            !!center &&
            center[0] > 700000 &&
            center[0] < 950000 &&
            center[1] > 6700000 &&
            center[1] < 6900000
        );
    }).toBe(true);

    await expect.poll(async () => {
        const coordinate = await getHighlightedCoordinate(page);
        return (
            !!coordinate &&
            coordinate[0] > 700000 &&
            coordinate[0] < 950000 &&
            coordinate[1] > 6700000 &&
            coordinate[1] < 6900000
        );
    }).toBe(true);

    await expect(initialForecastMessage).toBeHidden();
    await expect(infoPanel).toContainText(/Location:\s*Münster,\s*DE/i);
    await expect(page.getByTestId('weather-forecast')).toBeVisible();
    await expect(page.getByTestId('weather-forecast-entry')).toHaveCount(24);
});
