// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle, getMapCenter, getHighlightedCoordinate, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const layerSwitcher = page.getByTestId('layer-switcher');
    const infoPanel = page.getByTestId('info-panel');
    const geocoderPanel = page.getByTestId('geocoder-panel');
    const geocoderInput = page.getByTestId('geocoder-input');
    const weatherForecastSection = page.getByTestId('weather-forecast-section');
    const measurementToggle = page.getByTestId('measurement-toggle');

    await expect(layerSwitcher).toBeVisible();
    await expect(infoPanel).toBeVisible();
    await expect(geocoderPanel).toBeVisible();
    await expect(geocoderInput).toBeVisible();
    await expect(weatherForecastSection).toBeVisible();
    await expect(measurementToggle).not.toHaveAttribute('aria-pressed', 'true');

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(async () => (await getMapCenter(page)) !== undefined).toBe(true);
    await expect(weatherForecastSection).toContainText('Click on the map to load a forecast.');

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

    await temperatureCheckbox.click({ force: true });
    await expect(temperatureCheckbox).not.toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);

    await precipitationCheckbox.click({ force: true });
    await expect(precipitationCheckbox).toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

    await expect(page.getByTestId('temperature-legend')).toBeHidden();
    await expect(page.getByTestId('precipitation-legend')).toBeVisible();

    const initialCenter = await getMapCenter(page);
    if (!initialCenter) {
        throw new Error('Map center was not available after the map became ready.');
    }

    const hasForecastArrayLength = (
        value: unknown,
        wantedLength: number,
        path = ''
    ): boolean => {
        if (Array.isArray(value)) {
            const normalizedPath = path.toLowerCase();
            const looksLikeForecastData = [
                'forecast',
                'hourly',
                'timeseries',
                'time_series',
                'weather'
            ].some((token) => normalizedPath.includes(token));

            if (looksLikeForecastData && value.length === wantedLength) {
                return true;
            }

            return value.some((item) => hasForecastArrayLength(item, wantedLength, path));
        }

        if (value && typeof value === 'object') {
            return Object.entries(value as Record<string, unknown>).some(([key, child]) =>
                hasForecastArrayLength(child, wantedLength, path ? `${path}.${key}` : key)
            );
        }

        return false;
    };

    let forecastResponseContained24Entries = false;
    page.on('response', async (response) => {
        const contentType = response.headers()['content-type'] ?? '';
        if (!contentType.includes('application/json')) {
            return;
        }

        try {
            const body = await response.json();
            if (hasForecastArrayLength(body, 24)) {
                forecastResponseContained24Entries = true;
            }
        } catch {
            // Ignore non-JSON or unreadable responses.
        }
    });

    await geocoderInput.click();
    await geocoderInput.fill('Münster');

    const geocoderResults = page.getByTestId('geocoder-results');
    const firstResult = page.getByTestId('geocoder-result-item-0');

    await expect(geocoderResults).toBeVisible({ timeout: 10000 });
    await expect(firstResult).toBeVisible({ timeout: 10000 });
    await expect(firstResult).toContainText(/M.nster/i);

    await firstResult.click();

    await expect(geocoderInput).toHaveValue(/M.nster/i);

    await expect.poll(async () => (await getHighlightedCoordinate(page)) !== undefined, {
        timeout: 15000
    }).toBe(true);

    const highlightedCoordinate = await getHighlightedCoordinate(page);
    if (!highlightedCoordinate) {
        throw new Error('No highlighted coordinate was created for the selected geocoder result.');
    }

    const initialDistanceToHighlight = Math.hypot(
        initialCenter[0] - highlightedCoordinate[0],
        initialCenter[1] - highlightedCoordinate[1]
    );
    expect(initialDistanceToHighlight).toBeGreaterThan(10000);

    await expect.poll(async () => {
        const currentCenter = await getMapCenter(page);
        if (!currentCenter) {
            return 0;
        }

        return Math.hypot(
            currentCenter[0] - initialCenter[0],
            currentCenter[1] - initialCenter[1]
        );
    }, {
        timeout: 15000
    }).toBeGreaterThan(10000);

    await expect.poll(async () => {
        const currentCenter = await getMapCenter(page);
        if (!currentCenter) {
            return Number.POSITIVE_INFINITY;
        }

        return Math.hypot(
            currentCenter[0] - highlightedCoordinate[0],
            currentCenter[1] - highlightedCoordinate[1]
        );
    }, {
        timeout: 15000
    }).toBeLessThan(Math.max(20000, initialDistanceToHighlight / 2));

    await expect(weatherForecastSection).not.toContainText('Click on the map to load a forecast.', {
        timeout: 20000
    });
    await expect.poll(() => forecastResponseContained24Entries, {
        timeout: 20000
    }).toBe(true);
});
