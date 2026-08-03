// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import {
    getHighlightedCoordinate,
    getMapCenter,
    isLayerRendered
} from '../../../map-model-helpers';

function projectLonLatToWebMercator(lon: number, lat: number): [number, number] {
    const earthRadius = 6378137;
    const x = earthRadius * lon * Math.PI / 180;
    const clampedLat = Math.max(Math.min(lat, 85.05112878), -85.05112878);
    const y = earthRadius * Math.log(Math.tan(Math.PI / 4 + clampedLat * Math.PI / 360));
    return [x, y];
}

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const mapContainer = page.getByTestId('map-container');
    const layerSwitcher = page.getByTestId('layer-switcher');
    const infoPanel = page.getByTestId('info-panel');
    const measurementPanel = page.getByTestId('measurement-panel');
    const geocoderInput = page.getByTestId('geocoder-input');

    await expect(mapContainer).toBeVisible();
    await expect(layerSwitcher).toBeVisible();
    await expect(infoPanel).toBeVisible();
    await expect(measurementPanel).toBeHidden();
    await expect(geocoderInput).toBeVisible();

    await expect.poll(async () => (await getMapCenter(page)) !== undefined).toBe(true);
    const initialCenter = await getMapCenter(page);
    if (!initialCenter) {
        throw new Error('Map center is not available after page load.');
    }

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

    const geocodeResponsePromise = page.waitForResponse((response) => {
        const url = decodeURIComponent(response.url());
        return response.ok() && url.toLowerCase().includes('nominatim') && url.includes('Münster');
    });

    await geocoderInput.click();
    await geocoderInput.type('Münster');

    const geocodeResponse = await geocodeResponsePromise;
    const geocodeResults = (await geocodeResponse.json()) as Array<{
        lat: string;
        lon: string;
    }>;

    expect(Array.isArray(geocodeResults)).toBe(true);
    expect(geocodeResults.length).toBeGreaterThan(0);

    const firstGeocodeResult = geocodeResults[0];
    const expectedLon = Number(firstGeocodeResult.lon);
    const expectedLat = Number(firstGeocodeResult.lat);
    const expectedProjectedCoordinate = projectLonLatToWebMercator(expectedLon, expectedLat);

    const geocoderResults = page.getByTestId('geocoder-results');
    const firstGeocoderResult = page.getByTestId('geocoder-result-item-0');

    await expect(geocoderResults).toBeVisible();
    await expect(firstGeocoderResult).toBeVisible();
    await firstGeocoderResult.click();

    await expect.poll(async () => {
        const center = await getMapCenter(page);
        if (!center) {
            return 0;
        }
        return Math.hypot(center[0] - initialCenter[0], center[1] - initialCenter[1]);
    }).toBeGreaterThan(1000);

    await expect.poll(async () => {
        const highlight = await getHighlightedCoordinate(page);
        if (!highlight) {
            return Number.POSITIVE_INFINITY;
        }
        return Math.hypot(
            highlight[0] - expectedProjectedCoordinate[0],
            highlight[1] - expectedProjectedCoordinate[1]
        );
    }).toBeLessThan(20000);

    const weatherForecast = page.getByTestId('weather-forecast');
    const weatherForecastEntries = weatherForecast.locator('[data-testid^="weather-forecast-entry"]');

    await expect(weatherForecast).toBeVisible();
    await expect(weatherForecastEntries).toHaveCount(24);
});
