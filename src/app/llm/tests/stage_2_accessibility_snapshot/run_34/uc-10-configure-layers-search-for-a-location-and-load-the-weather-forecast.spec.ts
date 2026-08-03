// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

function hasForecastishKeys(value: unknown): boolean {
    if (!value || typeof value !== 'object') {
        return false;
    }

    const keys = Object.keys(value as Record<string, unknown>).map((key) => key.toLowerCase());
    return keys.some(
        (key) =>
            key.includes('time') ||
            key.includes('date') ||
            key.includes('temp') ||
            key.includes('precip') ||
            key.includes('uvi') ||
            key.includes('uv') ||
            key.includes('weather') ||
            key.includes('wind') ||
            key.includes('cloud')
    );
}

function extractForecastEntryCount(value: unknown): number | undefined {
    if (Array.isArray(value)) {
        if (value.length === 24 && value.every((item) => hasForecastishKeys(item))) {
            return 24;
        }

        for (const item of value) {
            const nestedCount = extractForecastEntryCount(item);
            if (nestedCount !== undefined) {
                return nestedCount;
            }
        }

        return undefined;
    }

    if (!value || typeof value !== 'object') {
        return undefined;
    }

    const entries = Object.entries(value as Record<string, unknown>);

    for (const [key, nestedValue] of entries) {
        const lowerKey = key.toLowerCase();
        if (
            (lowerKey.includes('forecast') ||
                lowerKey.includes('hourly') ||
                lowerKey.includes('timeseries') ||
                lowerKey.includes('entries')) &&
            Array.isArray(nestedValue) &&
            nestedValue.length === 24
        ) {
            return 24;
        }
    }

    const has24TimeAxis = entries.some(
        ([key, nestedValue]) =>
            (key.toLowerCase().includes('time') || key.toLowerCase().includes('date')) &&
            Array.isArray(nestedValue) &&
            nestedValue.length === 24
    );
    const has24WeatherAxis = entries.some(
        ([key, nestedValue]) =>
            (key.toLowerCase().includes('temp') ||
                key.toLowerCase().includes('precip') ||
                key.toLowerCase().includes('uvi') ||
                key.toLowerCase().includes('uv') ||
                key.toLowerCase().includes('weather') ||
                key.toLowerCase().includes('wind') ||
                key.toLowerCase().includes('cloud')) &&
            Array.isArray(nestedValue) &&
            nestedValue.length === 24
    );

    if (has24TimeAxis && has24WeatherAxis) {
        return 24;
    }

    for (const nestedValue of Object.values(value as Record<string, unknown>)) {
        const nestedCount = extractForecastEntryCount(nestedValue);
        if (nestedCount !== undefined) {
            return nestedCount;
        }
    }

    return undefined;
}

test('UC10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const layerSwitcher = page.getByTestId('layer-switcher');
    const infoPanel = page.getByTestId('info-panel');
    const geocoderPanel = page.getByTestId('geocoder-panel');
    const geocoderInput = page.getByTestId('geocoder-input');
    const measurementToggle = page.getByTestId('measurement-toggle');
    const scaleViewer = page.getByTestId('scale-viewer');
    const weatherForecastSection = page.getByTestId('weather-forecast-section');

    await expect(layerSwitcher).toBeVisible();
    await expect(infoPanel).toBeVisible();
    await expect(geocoderPanel).toBeVisible();
    await expect(geocoderInput).toBeVisible();
    await expect(weatherForecastSection).toBeVisible();
    await expect(measurementToggle).toBeVisible();
    await expect(measurementToggle).toHaveAttribute('aria-pressed', 'false');

    const temperatureToggle = layerSwitcher.getByRole('checkbox', { name: 'Temperature', exact: true });
    const precipitationToggle = layerSwitcher.getByRole('checkbox', { name: 'Precipitation', exact: true });

    await expect(temperatureToggle).toBeChecked();
    await expect(precipitationToggle).not.toBeChecked();

    const initialScaleText = ((await scaleViewer.textContent()) ?? '').trim();
    expect(initialScaleText).not.toBe('');

    await temperatureToggle.click({ force: true });
    await expect(temperatureToggle).not.toBeChecked();

    await precipitationToggle.click({ force: true });
    await expect(precipitationToggle).toBeChecked();

    await geocoderInput.click();
    await geocoderInput.fill('Münster');

    const searchResultName = /Münster|Munster/i;
    await expect(geocoderPanel).toContainText(searchResultName);

    let firstResult = geocoderPanel.getByRole('option', { name: searchResultName }).first();
    if ((await geocoderPanel.getByRole('option', { name: searchResultName }).count()) === 0) {
        if ((await geocoderPanel.getByRole('link', { name: searchResultName }).count()) > 0) {
            firstResult = geocoderPanel.getByRole('link', { name: searchResultName }).first();
        } else if ((await geocoderPanel.getByRole('button', { name: searchResultName }).count()) > 0) {
            firstResult = geocoderPanel.getByRole('button', { name: searchResultName }).first();
        } else if ((await geocoderPanel.getByRole('listitem', { name: searchResultName }).count()) > 0) {
            firstResult = geocoderPanel.getByRole('listitem', { name: searchResultName }).first();
        } else {
            firstResult = geocoderPanel.getByText(searchResultName).first();
        }
    }

    await expect(firstResult).toBeVisible();

    let forecastEntryCount: number | undefined;
    const forecastResponsePromise = page.waitForResponse(async (response) => {
        if (!response.ok()) {
            return false;
        }

        const contentType = response.headers()['content-type'] ?? '';
        if (!contentType.toLowerCase().includes('application/json')) {
            return false;
        }

        try {
            const body = await response.json();
            forecastEntryCount = extractForecastEntryCount(body);
            return forecastEntryCount === 24;
        } catch {
            return false;
        }
    });

    await firstResult.click();

    await expect(geocoderInput).toHaveValue(searchResultName);
    await expect.poll(async () => ((await scaleViewer.textContent()) ?? '').trim()).not.toBe(initialScaleText);

    await forecastResponsePromise;
    expect(forecastEntryCount).toBe(24);

    await expect(weatherForecastSection).toBeVisible();
    await expect(weatherForecastSection).not.toContainText('Click on the map to load a forecast.');
});
