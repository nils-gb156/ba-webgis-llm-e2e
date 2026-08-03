// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

function extractForecastEntryCount(payload: unknown): number | undefined {
    if (Array.isArray(payload)) {
        for (const item of payload) {
            const nested = extractForecastEntryCount(item);
            if (nested !== undefined) {
                return nested;
            }
        }
        return undefined;
    }

    if (!payload || typeof payload !== 'object') {
        return undefined;
    }

    const record = payload as Record<string, unknown>;

    const hourly = record['hourly'];
    if (hourly && typeof hourly === 'object' && !Array.isArray(hourly)) {
        const hourlyRecord = hourly as Record<string, unknown>;
        const time = hourlyRecord['time'];
        if (Array.isArray(time)) {
            return time.length;
        }
    }

    const properties = record['properties'];
    if (properties && typeof properties === 'object' && !Array.isArray(properties)) {
        const propertiesRecord = properties as Record<string, unknown>;
        const timeseries = propertiesRecord['timeseries'];
        if (Array.isArray(timeseries)) {
            return timeseries.length;
        }
    }

    const timeseries = record['timeseries'];
    if (Array.isArray(timeseries)) {
        return timeseries.length;
    }

    const forecast = record['forecast'];
    if (Array.isArray(forecast)) {
        return forecast.length;
    }

    const entries = record['entries'];
    if (Array.isArray(entries)) {
        return entries.length;
    }

    for (const value of Object.values(record)) {
        const nested = extractForecastEntryCount(value);
        if (nested !== undefined) {
            return nested;
        }
    }

    return undefined;
}

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
    const forecastRequestUrls: string[] = [];
    const forecastEntryCounts: number[] = [];

    page.on('request', request => {
        const url = request.url().toLowerCase();
        const resourceType = request.resourceType();
        if ((resourceType === 'fetch' || resourceType === 'xhr') && (url.includes('forecast') || url.includes('weather'))) {
            forecastRequestUrls.push(request.url());
        }
    });

    page.on('response', async response => {
        try {
            if (!response.ok()) {
                return;
            }

            const resourceType = response.request().resourceType();
            if (resourceType !== 'fetch' && resourceType !== 'xhr') {
                return;
            }

            const url = response.url().toLowerCase();
            const contentType = (response.headers()['content-type'] ?? '').toLowerCase();
            if (!contentType.includes('json') && !url.includes('json')) {
                return;
            }

            const payload = await response.json();
            const entryCount = extractForecastEntryCount(payload);

            if (entryCount !== undefined && (url.includes('forecast') || url.includes('weather') || entryCount === 24)) {
                forecastEntryCounts.push(entryCount);
            }
        } catch {
            // Ignore non-JSON or unrelated responses.
        }
    });

    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const layerSwitcher = page.getByTestId('layer-switcher');
    const infoPanel = page.getByTestId('info-panel');
    const weatherForecastSection = page.getByTestId('weather-forecast-section');
    const geocoderInput = page.getByRole('textbox', { name: 'Geocoder search', exact: true });
    const measurementToggle = page.getByTestId('measurement-toggle');
    const temperatureCheckbox = layerSwitcher.getByRole('checkbox', { name: 'Temperature', exact: true });
    const precipitationCheckbox = layerSwitcher.getByRole('checkbox', { name: 'Precipitation', exact: true });
    const scaleViewer = page.getByTestId('scale-viewer');

    await expect(layerSwitcher).toBeVisible();
    await expect(infoPanel).toBeVisible();
    await expect(geocoderInput).toBeVisible();
    await expect(measurementToggle).not.toHaveAttribute('aria-pressed', 'true');

    await expect(temperatureCheckbox).toBeChecked();
    await expect(precipitationCheckbox).not.toBeChecked();

    await expect(scaleViewer).toBeVisible();
    const initialScaleText = ((await scaleViewer.textContent()) ?? '').trim();

    await temperatureCheckbox.click({ force: true });
    await expect(temperatureCheckbox).not.toBeChecked();

    await precipitationCheckbox.click({ force: true });
    await expect(precipitationCheckbox).toBeChecked();

    await geocoderInput.click();
    await geocoderInput.fill('');
    await geocoderInput.pressSequentially('Münster');

    const firstSearchResult = page
        .getByRole('option')
        .or(page.getByRole('button'))
        .or(page.getByRole('link'))
        .or(page.getByRole('listitem'))
        .filter({ hasText: /münster/i })
        .first();

    await expect(firstSearchResult).toBeVisible();
    await firstSearchResult.click();

    await expect.poll(async () => {
        const currentScaleText = ((await scaleViewer.textContent()) ?? '').trim();
        return currentScaleText !== '' && (currentScaleText !== initialScaleText || forecastRequestUrls.length > 0 || forecastEntryCounts.length > 0);
    }).toBe(true);

    await expect(infoPanel).toBeVisible();
    await expect(weatherForecastSection).toBeVisible();
    await expect(weatherForecastSection).not.toContainText('Click on the map to load a forecast.');

    await expect.poll(async () => {
        const listItemCount = await weatherForecastSection.getByRole('listitem').count();
        if (listItemCount > 0) {
            return listItemCount;
        }

        const rowCount = await weatherForecastSection.getByRole('row').count();
        if (rowCount > 0) {
            return rowCount;
        }

        const articleCount = await weatherForecastSection.getByRole('article').count();
        if (articleCount > 0) {
            return articleCount;
        }

        return forecastEntryCounts.length > 0 ? forecastEntryCounts[forecastEntryCounts.length - 1] : 0;
    }).toBe(24);
});
