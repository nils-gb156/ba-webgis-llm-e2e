// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getMapCenter, getHighlightedCoordinate, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({
    page
}) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const layerSwitcher = page.getByTestId('layer-switcher');
    const infoPanel = page.getByTestId('info-panel');
    const geocoderPanel = page.getByTestId('geocoder-panel');
    const weatherForecastSection = page.getByTestId('weather-forecast-section');

    await expect(layerSwitcher).toBeVisible();
    await expect(infoPanel).toBeVisible();
    await expect(geocoderPanel).toBeVisible();
    await expect(weatherForecastSection).toBeVisible();
    await expect(weatherForecastSection).toContainText('Click on the map to load a forecast.');
    await expect
        .poll(() => page.getByTestId('measurement-toggle').getAttribute('aria-pressed'))
        .not.toBe('true');

    const temperatureCheckbox = page.getByRole('checkbox', { name: 'Temperature', exact: true });
    const precipitationCheckbox = page.getByRole('checkbox', { name: 'Precipitation', exact: true });
    const temperatureLegend = page.getByTestId('temperature-legend');
    const precipitationLegend = page.getByTestId('precipitation-legend');

    await expect(temperatureCheckbox).toBeChecked();
    await expect(precipitationCheckbox).not.toBeChecked();
    await expect(temperatureLegend).toBeVisible();
    await expect(precipitationLegend).toBeHidden();
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(false);

    await expect.poll(() => getMapCenter(page)).not.toBeUndefined();
    const initialCenter = await getMapCenter(page);
    if (!initialCenter) {
        throw new Error('Initial map center is not available.');
    }

    await temperatureCheckbox.click({ force: true });
    await expect(temperatureCheckbox).not.toBeChecked();
    await expect(temperatureLegend).toBeHidden();
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);

    await precipitationCheckbox.click({ force: true });
    await expect(precipitationCheckbox).toBeChecked();
    await expect(precipitationLegend).toBeVisible();
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

    const geocoderInput = page.getByRole('textbox', { name: 'Geocoder search', exact: true });
    await expect(geocoderInput).toBeVisible();
    await geocoderInput.click();
    await geocoderInput.fill('Münster');
    await expect(geocoderInput).toHaveValue('Münster');

    const geocoderResults = page.getByTestId('geocoder-results');
    const firstSearchResult = page.getByTestId('geocoder-result-item-0');

    await expect(geocoderResults).toBeVisible();
    await expect(firstSearchResult).toBeVisible();
    await expect(firstSearchResult).toContainText('Münster');
    await firstSearchResult.click();

    await expect.poll(() => getHighlightedCoordinate(page)).not.toBeUndefined();
    await expect.poll(() => getMapCenter(page)).not.toEqual(initialCenter);

    await expect(weatherForecastSection).toBeVisible();
    await expect(weatherForecastSection).not.toContainText('Click on the map to load a forecast.');
    await expect.poll(async () => {
        const text = (await weatherForecastSection.textContent()) ?? '';
        return (text.match(/\b\d{1,2}:\d{2}\b/g) ?? []).length;
    }).toBe(24);
});
