// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapCenter, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({
    page
}) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
    await page.waitForLoadState('networkidle');

    function findForecastEntryCount(value: unknown): number | undefined {
        if (Array.isArray(value)) {
            if (value.length === 24 && value.every((item) => item !== null && typeof item === 'object')) {
                return 24;
            }

            for (const item of value) {
                const nestedCount = findForecastEntryCount(item);
                if (nestedCount !== undefined) {
                    return nestedCount;
                }
            }

            return undefined;
        }

        if (value && typeof value === 'object') {
            for (const [key, nestedValue] of Object.entries(value as Record<string, unknown>)) {
                const normalizedKey = key.toLowerCase();
                if (
                    ['forecast', 'forecasts', 'hourly', 'timeseries', 'entries', 'data'].includes(normalizedKey) &&
                    Array.isArray(nestedValue) &&
                    nestedValue.length === 24
                ) {
                    return 24;
                }

                const nestedCount = findForecastEntryCount(nestedValue);
                if (nestedCount !== undefined) {
                    return nestedCount;
                }
            }
        }

        return undefined;
    }

    let forecastEntryCount: number | undefined;
    page.on('response', async (response) => {
        const url = response.url().toLowerCase();
        if (!response.ok() || (!url.includes('forecast') && !url.includes('weather'))) {
            return;
        }

        try {
            const body = await response.json();
            const detectedCount = findForecastEntryCount(body);
            if (detectedCount !== undefined) {
                forecastEntryCount = detectedCount;
            }
        } catch {
            // Ignore non-JSON responses such as map tiles.
        }
    });

    const layerSwitcher = page.getByTestId('layer-switcher');
    const infoPanel = page.getByTestId('info-panel');
    const geocoderPanel = page.getByTestId('geocoder-panel');
    const weatherForecastSection = page.getByTestId('weather-forecast-section');
    const measurementToggle = page.getByTestId('measurement-toggle');

    await expect(layerSwitcher).toBeVisible();
    await expect(infoPanel).toBeVisible();
    await expect(geocoderPanel).toBeVisible();
    await expect(weatherForecastSection).toBeVisible();
    await expect(measurementToggle).not.toHaveAttribute('aria-pressed', 'true');

    const geocoderInput = page.getByRole('textbox', { name: 'Geocoder search', exact: true });
    await expect(geocoderInput).toBeVisible();

    const temperatureCheckbox = page.getByRole('checkbox', { name: 'Temperature', exact: true });
    const precipitationCheckbox = page.getByRole('checkbox', { name: 'Precipitation', exact: true });

    await expect(temperatureCheckbox).toBeChecked();
    await expect(precipitationCheckbox).not.toBeChecked();

    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(false);

    await expect.poll(() => getMapCenter(page)).not.toBeUndefined();
    const initialCenter = (await getMapCenter(page))!;

    await temperatureCheckbox.click({ force: true });
    await expect(temperatureCheckbox).not.toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);

    await precipitationCheckbox.click({ force: true });
    await expect(precipitationCheckbox).toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

    await geocoderInput.click();
    await geocoderInput.fill('Münster');
    await expect(geocoderInput).toHaveValue('Münster');

    await expect.poll(async () => page.getByRole('option').count()).toBeGreaterThan(0);
    const firstSearchResult = page.getByRole('option').first();
    await expect(firstSearchResult).toBeVisible();
    await firstSearchResult.click();

    await expect.poll(async () => {
        const center = await getMapCenter(page);
        if (!center) {
            return false;
        }

        const movedDistance = Math.hypot(center[0] - initialCenter[0], center[1] - initialCenter[1]);
        const nearMuenster =
            Math.abs(center[0] - 849000) < 200000 && Math.abs(center[1] - 6793000) < 200000;

        return movedDistance > 100000 && nearMuenster;
    }).toBe(true);

    await expect(weatherForecastSection).toBeVisible();
    await expect.poll(async () => {
        const listItemCount = await weatherForecastSection.getByRole('listitem').count();
        return listItemCount === 24 || forecastEntryCount === 24;
    }).toBe(true);
});
