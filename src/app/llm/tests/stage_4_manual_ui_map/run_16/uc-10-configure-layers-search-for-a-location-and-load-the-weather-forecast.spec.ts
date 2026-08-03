// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import {
    getActiveBaseLayerTitle,
    getMapCenter,
    isLayerRendered
} from '../../../map-model-helpers';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');

    const layerSwitcher = page.getByTestId('layer-switcher');
    const infoPanel = page.getByTestId('info-panel');
    const measurementPanel = page.getByTestId('measurement-panel');
    const geocoderInput = page.getByTestId('geocoder-input');
    const geocoderResults = page.getByTestId('geocoder-results');
    const mapContainer = page.getByTestId('map-container');

    await expect(layerSwitcher).toBeVisible();
    await expect(infoPanel).toBeVisible();
    await expect(measurementPanel).toBeHidden();
    await expect(geocoderInput).toBeVisible();

    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(false);

    const temperatureCheckbox = layerSwitcher.getByRole('checkbox', { name: 'Temperature', exact: true });
    const precipitationCheckbox = layerSwitcher.getByRole('checkbox', { name: 'Precipitation', exact: true });

    await expect(temperatureCheckbox).toBeChecked();
    await temperatureCheckbox.click({ force: true });
    await expect(temperatureCheckbox).not.toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);

    await expect(precipitationCheckbox).not.toBeChecked();
    await precipitationCheckbox.click({ force: true });
    await expect(precipitationCheckbox).toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

    let centerBeforeSelection: [number, number] | undefined;
    await expect.poll(async () => {
        centerBeforeSelection = await getMapCenter(page);
        return Array.isArray(centerBeforeSelection);
    }).toBe(true);

    const geocoderResponsePromise = page.waitForResponse((response) => {
        const url = response.url();
        return (
            response.request().method() === 'GET' &&
            response.status() === 200 &&
            url.toLowerCase().includes('search') &&
            (url.includes('M%C3%BCnster') || url.includes('Münster'))
        );
    });

    await geocoderInput.click();
    await geocoderInput.fill('Münster');

    const geocoderResponse = await geocoderResponsePromise;
    const searchResults = (await geocoderResponse.json()) as Array<{ lat: string; lon: string }>;
    expect(searchResults.length).toBeGreaterThan(0);

    const firstSearchResult = searchResults[0];
    const lon = Number(firstSearchResult.lon);
    const lat = Number(firstSearchResult.lat);
    const earthRadius = 6378137;
    const expectedX = earthRadius * (lon * Math.PI / 180);
    const expectedY = earthRadius * Math.log(Math.tan(Math.PI / 4 + lat * Math.PI / 360));
    const centerToleranceInMeters = 50000;

    await expect(page.getByTestId('geocoder-clear-button')).toBeVisible();
    await expect(geocoderResults).toBeVisible();

    const firstResultItem = geocoderResults.getByTestId(/^geocoder-result-item-/).first();
    await expect(firstResultItem).toBeVisible();
    await firstResultItem.click();

    await expect.poll(async () => {
        const center = await getMapCenter(page);
        if (!center || !centerBeforeSelection) {
            return false;
        }

        const movedFromPreviousCenter =
            Math.abs(center[0] - centerBeforeSelection[0]) > 1000 ||
            Math.abs(center[1] - centerBeforeSelection[1]) > 1000;
        const centeredNearSearchResult =
            Math.abs(center[0] - expectedX) < centerToleranceInMeters &&
            Math.abs(center[1] - expectedY) < centerToleranceInMeters;

        return movedFromPreviousCenter && centeredNearSearchResult;
    }).toBe(true);

    const mapBox = await mapContainer.boundingBox();
    expect(mapBox).not.toBeNull();
    if (!mapBox) {
        throw new Error('Map container has no bounding box.');
    }

    await mapContainer.click({
        position: {
            x: Math.round(mapBox.width / 2),
            y: Math.round(mapBox.height / 2)
        }
    });

    const weatherForecast = page.getByTestId('weather-forecast');
    await expect(weatherForecast).toBeVisible();
    await expect(weatherForecast.getByTestId('weather-forecast-entry')).toHaveCount(24);
});
