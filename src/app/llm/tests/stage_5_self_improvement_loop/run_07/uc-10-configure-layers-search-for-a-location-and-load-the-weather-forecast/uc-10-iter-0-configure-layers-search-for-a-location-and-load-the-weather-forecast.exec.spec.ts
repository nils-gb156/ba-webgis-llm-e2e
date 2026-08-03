// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getMapCenter, isLayerRendered } from '../../../../map-model-helpers';

test('UC10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const layerSwitcher = page.getByTestId('layer-switcher');
    const infoPanel = page.getByTestId('info-panel');
    const weatherForecastSection = page.getByTestId('weather-forecast-section');
    const searchInput = page.getByRole('textbox', { name: 'Geocoder search', exact: true });
    const measurementToggle = page.getByTestId('measurement-toggle');
    const temperatureCheckbox = page.getByRole('checkbox', { name: 'Temperature', exact: true });
    const precipitationCheckbox = page.getByRole('checkbox', { name: 'Precipitation', exact: true });

    await expect(layerSwitcher).toBeVisible();
    await expect(infoPanel).toBeVisible();
    await expect(searchInput).toBeVisible();
    await expect(weatherForecastSection).toBeVisible();
    await expect(measurementToggle).not.toHaveAttribute('aria-pressed', 'true');

    await expect(temperatureCheckbox).toBeChecked();
    await expect(precipitationCheckbox).not.toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(false);
    await expect(weatherForecastSection).toContainText('Click on the map to load a forecast.');

    await temperatureCheckbox.click({ force: true });
    await expect(temperatureCheckbox).not.toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);

    await precipitationCheckbox.click({ force: true });
    await expect(precipitationCheckbox).toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

    await expect.poll(() => getMapCenter(page)).not.toBeUndefined();
    const centerBeforeSelection = (await getMapCenter(page))!;

    const getForecastEntryCount = (data: unknown): number | undefined => {
        if (Array.isArray(data)) {
            return data.length;
        }
        if (!data || typeof data !== 'object') {
            return undefined;
        }

        const record = data as Record<string, unknown>;
        const topLevelArrays = [record.hourly, record.forecast, record.entries, record.items];
        const topLevelArray = topLevelArrays.find(Array.isArray);
        if (Array.isArray(topLevelArray)) {
            return topLevelArray.length;
        }

        if (record.hourly && typeof record.hourly === 'object' && !Array.isArray(record.hourly)) {
            const hourlyRecord = record.hourly as Record<string, unknown>;
            const hourlyArrays = [
                hourlyRecord.time,
                hourlyRecord.times,
                hourlyRecord.entries,
                hourlyRecord.temperature_2m,
                hourlyRecord.weathercode
            ];
            const hourlyArray = hourlyArrays.find(Array.isArray);
            if (Array.isArray(hourlyArray)) {
                return hourlyArray.length;
            }
        }

        return undefined;
    };

    const looksLikeForecastResponse = (data: unknown, url: string): boolean => {
        if (url.includes('forecast') || url.includes('weather')) {
            return true;
        }
        if (!data || typeof data !== 'object' || Array.isArray(data)) {
            return false;
        }
        const record = data as Record<string, unknown>;
        return 'hourly' in record || 'forecast' in record || 'temperature_2m' in record || 'weathercode' in record;
    };

    let forecastEntryCount: number | undefined;
    const forecastResponsePromise = page.waitForResponse(async (response) => {
        if (!response.ok()) {
            return false;
        }

        const contentType = response.headers()['content-type'] ?? '';
        if (!contentType.toLowerCase().includes('json')) {
            return false;
        }

        try {
            const data = await response.json();
            const count = getForecastEntryCount(data);
            if (count !== 24) {
                return false;
            }

            const url = response.url().toLowerCase();
            if (!looksLikeForecastResponse(data, url)) {
                return false;
            }

            forecastEntryCount = count;
            return true;
        } catch {
            return false;
        }
    });

    await searchInput.click();
    await searchInput.fill('Münster');

    const optionResults = page.getByRole('option').filter({ hasText: /Münster/i });
    const buttonResults = page.getByRole('button').filter({ hasText: /Münster/i });
    const linkResults = page.getByRole('link').filter({ hasText: /Münster/i });
    const listItemResults = page.getByRole('listitem').filter({ hasText: /Münster/i });

    await expect
        .poll(async () => {
            const optionCount = await optionResults.count();
            const buttonCount = await buttonResults.count();
            const linkCount = await linkResults.count();
            const listItemCount = await listItemResults.count();
            return optionCount + buttonCount + linkCount + listItemCount;
        })
        .toBeGreaterThan(0);

    if ((await optionResults.count()) > 0) {
        await optionResults.first().click();
    } else if ((await buttonResults.count()) > 0) {
        await buttonResults.first().click();
    } else if ((await linkResults.count()) > 0) {
        await linkResults.first().click();
    } else {
        await listItemResults.first().click();
    }

    await expect
        .poll(async () => {
            const center = await getMapCenter(page);
            if (!center) {
                return 0;
            }
            return Math.hypot(center[0] - centerBeforeSelection[0], center[1] - centerBeforeSelection[1]);
        })
        .toBeGreaterThan(10000);

    await forecastResponsePromise;
    expect(forecastEntryCount).toBe(24);

    await expect(infoPanel).toBeVisible();
    await expect(weatherForecastSection).toBeVisible();
    await expect(weatherForecastSection).not.toContainText('Click on the map to load a forecast.');
});
