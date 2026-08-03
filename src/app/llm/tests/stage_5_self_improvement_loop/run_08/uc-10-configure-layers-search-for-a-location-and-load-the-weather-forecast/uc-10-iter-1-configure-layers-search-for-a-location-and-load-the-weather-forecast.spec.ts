// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapCenter, isLayerRendered } from '../../../../map-model-helpers';

test('UC10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const layerSwitcher = page.getByTestId('layer-switcher');
    const infoPanel = page.getByTestId('info-panel');
    const geocoderInput = page.getByTestId('geocoder-input');
    const weatherForecastSection = page.getByTestId('weather-forecast-section');
    const measurementToggle = page.getByTestId('measurement-toggle');
    const initialForecastMessage = weatherForecastSection.getByText(
        'Click on the map to load a forecast.',
        { exact: true }
    );

    await expect(layerSwitcher).toBeVisible();
    await expect(infoPanel).toBeVisible();
    await expect(geocoderInput).toBeVisible();
    await expect(weatherForecastSection).toBeVisible();
    await expect(initialForecastMessage).toBeVisible();
    await expect(measurementToggle).toBeVisible();
    await expect
        .poll(async () => (await measurementToggle.getAttribute('aria-pressed')) ?? 'false')
        .toBe('false');

    const temperatureCheckbox = layerSwitcher.getByRole('checkbox', {
        name: 'Temperature',
        exact: true
    });
    const precipitationCheckbox = layerSwitcher.getByRole('checkbox', {
        name: 'Precipitation',
        exact: true
    });

    await expect(temperatureCheckbox).toBeChecked();
    await expect(precipitationCheckbox).not.toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(false);

    await expect.poll(() => getMapCenter(page)).toBeTruthy();
    const initialCenter = await getMapCenter(page);
    expect(initialCenter).toBeDefined();

    await temperatureCheckbox.click({ force: true });
    await expect(temperatureCheckbox).not.toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);

    await precipitationCheckbox.click({ force: true });
    await expect(precipitationCheckbox).toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

    await geocoderInput.click();
    await geocoderInput.fill('Münster');

    const geocoderResults = page.getByTestId('geocoder-results');
    const firstSearchResult = page.getByTestId('geocoder-result-item-0');

    await expect(geocoderResults).toBeVisible();
    await expect(firstSearchResult).toBeVisible();
    await expect(firstSearchResult).toContainText(/M(?:ü|u)nster/i);
    await expect(firstSearchResult).toContainText(/Germany/i);

    const forecastResponsePromise = page.waitForResponse((response) => {
        const url = response.url().toLowerCase();
        const resourceType = response.request().resourceType();
        return (
            response.ok() &&
            (resourceType === 'fetch' || resourceType === 'xhr') &&
            url.includes('forecast')
        );
    });

    await firstSearchResult.click();

    const forecastResponse = await forecastResponsePromise;

    await expect.poll(async () => {
        const center = await getMapCenter(page);
        if (!center || !initialCenter) {
            return 0;
        }
        return Math.hypot(center[0] - initialCenter[0], center[1] - initialCenter[1]);
    }).toBeGreaterThan(50000);

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

    await expect(initialForecastMessage).toBeHidden();

    const forecastPayload: unknown = await forecastResponse.json();
    const forecastEntryCount = (() => {
        if (Array.isArray(forecastPayload)) {
            return forecastPayload.length;
        }

        if (forecastPayload && typeof forecastPayload === 'object') {
            const payload = forecastPayload as Record<string, unknown>;

            if (payload.hourly && typeof payload.hourly === 'object') {
                const hourly = payload.hourly as Record<string, unknown>;
                if (Array.isArray(hourly.time)) {
                    return hourly.time.length;
                }
            }

            for (const key of ['entries', 'forecast', 'data', 'items']) {
                const value = payload[key];
                if (Array.isArray(value)) {
                    return value.length;
                }
            }
        }

        return undefined;
    })();

    expect(forecastEntryCount).toBe(24);
});
