// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import {
    getMapCenter,
    getHighlightedCoordinate,
    isLayerRendered
} from '../../../../map-model-helpers';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({
    page
}) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const layerSwitcher = page.getByTestId('layer-switcher');
    const infoPanel = page.getByTestId('info-panel');
    const geocoderPanel = page.getByTestId('geocoder-panel');
    const geocoderInput = page.getByTestId('geocoder-input');
    const weatherForecastSection = page.getByTestId('weather-forecast-section');
    const weatherForecast = page.getByTestId('weather-forecast');
    const weatherForecastEntries = page.getByTestId('weather-forecast-entry');
    const measurementToggle = page.getByTestId('measurement-toggle');

    const temperatureCheckbox = page.getByRole('checkbox', { name: 'Temperature', exact: true });
    const precipitationCheckbox = page.getByRole('checkbox', {
        name: 'Precipitation',
        exact: true
    });

    const temperatureLegend = page.getByTestId('temperature-legend');
    const precipitationLegend = page.getByTestId('precipitation-legend');

    const searchText = 'M\u00FCnster';
    const searchTextPattern = /M.nster/i;

    await expect(layerSwitcher).toBeVisible();
    await expect(infoPanel).toBeVisible();
    await expect(geocoderPanel).toBeVisible();
    await expect(geocoderInput).toBeVisible();
    await expect(weatherForecastSection).toBeVisible();
    await expect(measurementToggle).toBeVisible();

    const measurementPressed = await measurementToggle.getAttribute('aria-pressed');
    expect(measurementPressed === null || measurementPressed === 'false').toBe(true);

    await expect(weatherForecastSection).toContainText('Click on the map to load a forecast.');

    await expect(temperatureCheckbox).toBeChecked();
    await expect(precipitationCheckbox).not.toBeChecked();

    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(false);

    await expect(temperatureLegend).toBeVisible();
    await expect(precipitationLegend).toHaveCount(0);

    await expect.poll(async () => (await getMapCenter(page))?.length).toBe(2);
    const initialCenter = await getMapCenter(page);
    if (!initialCenter) {
        throw new Error('Map center was not available after initial load.');
    }

    await temperatureCheckbox.click({ force: true });
    await expect(temperatureCheckbox).not.toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);
    await expect(temperatureLegend).toHaveCount(0);

    await precipitationCheckbox.click({ force: true });
    await expect(precipitationCheckbox).toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);
    await expect(precipitationLegend).toBeVisible();

    await geocoderInput.click();
    await geocoderInput.fill(searchText);
    await expect(page.getByTestId('geocoder-clear-button')).toBeVisible();

    const optionResults = geocoderPanel.getByRole('option').filter({ hasText: searchTextPattern });
    const listItemResults = geocoderPanel
        .getByRole('listitem')
        .filter({ hasText: searchTextPattern });
    const buttonResults = geocoderPanel.getByRole('button', { name: searchTextPattern });
    const textResults = geocoderPanel.getByText(searchTextPattern);

    await expect
        .poll(async () => {
            if ((await optionResults.count()) > 0) return 'option';
            if ((await listItemResults.count()) > 0) return 'listitem';
            if ((await buttonResults.count()) > 0) return 'button';
            if ((await textResults.count()) > 0) return 'text';
            return '';
        })
        .not.toBe('');

    const resultKind = await (async () => {
        if ((await optionResults.count()) > 0) return 'option';
        if ((await listItemResults.count()) > 0) return 'listitem';
        if ((await buttonResults.count()) > 0) return 'button';
        if ((await textResults.count()) > 0) return 'text';
        return '';
    })();

    if (resultKind === 'option') {
        await optionResults.first().click();
    } else if (resultKind === 'listitem') {
        await listItemResults.first().click();
    } else if (resultKind === 'button') {
        await buttonResults.first().click();
    } else if (resultKind === 'text') {
        await textResults.first().click();
    } else {
        throw new Error('No selectable geocoder result for Münster became visible.');
    }

    await expect(geocoderInput).toHaveValue(searchTextPattern);

    await expect.poll(async () => (await getHighlightedCoordinate(page))?.length).toBe(2);

    await expect
        .poll(async () => {
            const currentCenter = await getMapCenter(page);
            if (!currentCenter) return 0;
            return Math.hypot(
                currentCenter[0] - initialCenter[0],
                currentCenter[1] - initialCenter[1]
            );
        })
        .toBeGreaterThan(50000);

    await expect(weatherForecastSection).not.toContainText('Click on the map to load a forecast.');
    await expect(weatherForecast).toBeVisible();
    await expect(infoPanel.getByText(/^Location:\s*M.nster,\s*DE$/i)).toBeVisible();
    await expect(weatherForecastEntries).toHaveCount(24);
});
