// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({
    page
}) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const mapContainer = page.getByTestId('map-container');
    const layerSwitcher = page.getByTestId('layer-switcher');
    const infoPanel = page.getByTestId('info-panel');
    const geocoderPanel = page.getByTestId('geocoder-panel');
    const weatherForecastSection = page.getByTestId('weather-forecast-section');
    const scaleViewer = page.getByTestId('scale-viewer');
    const measurementToggle = page.getByTestId('measurement-toggle');

    await expect(mapContainer).toBeVisible();
    await expect(layerSwitcher).toBeVisible();
    await expect(infoPanel).toBeVisible();
    await expect(geocoderPanel).toBeVisible();
    await expect(scaleViewer).toBeVisible();
    await expect(weatherForecastSection).toBeVisible();
    await expect(weatherForecastSection).toContainText('Click on the map to load a forecast.');

    const measurementPressed = await measurementToggle.getAttribute('aria-pressed');
    expect(measurementPressed).not.toBe('true');

    const temperatureLayerToggle = layerSwitcher.getByRole('checkbox', {
        name: 'Temperature',
        exact: true
    });
    const precipitationLayerToggle = layerSwitcher.getByRole('checkbox', {
        name: 'Precipitation',
        exact: true
    });

    await expect(temperatureLayerToggle).toBeChecked();
    await expect(precipitationLayerToggle).not.toBeChecked();

    const initialScaleText = ((await scaleViewer.textContent()) ?? '').trim();
    expect(initialScaleText).not.toBe('');

    await temperatureLayerToggle.click({ force: true });
    await expect(temperatureLayerToggle).not.toBeChecked();

    await precipitationLayerToggle.click({ force: true });
    await expect(precipitationLayerToggle).toBeChecked();

    const searchInput = geocoderPanel.getByRole('textbox', {
        name: 'Geocoder search',
        exact: true
    });

    await expect(searchInput).toBeVisible();
    await searchInput.click();
    await searchInput.fill('Münster');

    const firstSearchResult = geocoderPanel.getByRole('option').first();
    await expect(firstSearchResult).toBeVisible();
    await firstSearchResult.click();

    await expect.poll(async () => /münster/i.test(await searchInput.inputValue())).toBe(true);

    await expect.poll(async () => {
        const currentScaleText = ((await scaleViewer.textContent()) ?? '').trim();
        return currentScaleText !== '' && currentScaleText !== initialScaleText;
    }).toBe(true);

    await expect(weatherForecastSection).toBeVisible();
    await expect(weatherForecastSection).not.toContainText('Click on the map to load a forecast.');

    await expect.poll(async () => {
        const listItemCount = await weatherForecastSection.getByRole('listitem').count();
        if (listItemCount > 0) {
            return listItemCount;
        }

        const articleCount = await weatherForecastSection.getByRole('article').count();
        if (articleCount > 0) {
            return articleCount;
        }

        const rowCount = await weatherForecastSection.getByRole('row').count();
        if (rowCount > 1) {
            return rowCount - 1;
        }

        const listElementCount = await weatherForecastSection.locator('li').count();
        if (listElementCount > 0) {
            return listElementCount;
        }

        const articleElementCount = await weatherForecastSection.locator('article').count();
        if (articleElementCount > 0) {
            return articleElementCount;
        }

        const tableRowElementCount = await weatherForecastSection.locator('tr').count();
        if (tableRowElementCount > 1) {
            return tableRowElementCount - 1;
        }

        return 0;
    }).toBe(24);

    await expect(temperatureLayerToggle).not.toBeChecked();
    await expect(precipitationLayerToggle).toBeChecked();
});
