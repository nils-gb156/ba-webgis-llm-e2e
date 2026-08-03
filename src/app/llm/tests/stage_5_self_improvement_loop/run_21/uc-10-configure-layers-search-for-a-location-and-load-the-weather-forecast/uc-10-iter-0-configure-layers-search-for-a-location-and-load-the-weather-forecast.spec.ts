// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import {
    getHighlightedCoordinate,
    getMapCenter,
    getMapZoomLevel,
    isLayerRendered
} from '../../../../map-model-helpers';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({
    page
}) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const layerSwitcher = page.getByTestId('layer-switcher');
    const layerSwitcherToggle = page.getByTestId('layer-switcher-toggle');
    const infoPanel = page.getByTestId('info-panel');
    const infoPanelToggle = page.getByTestId('info-panel-toggle');
    const geocoderPanel = page.getByTestId('geocoder-panel');
    const geocoderInput = page.getByTestId('geocoder-input');
    const weatherForecastSection = page.getByTestId('weather-forecast-section');
    const measurementToggle = page.getByTestId('measurement-toggle');

    const temperatureCheckbox = layerSwitcher.getByRole('checkbox', {
        name: 'Temperature',
        exact: true
    });
    const precipitationCheckbox = layerSwitcher.getByRole('checkbox', {
        name: 'Precipitation',
        exact: true
    });

    await expect(layerSwitcher).toBeVisible();
    await expect(layerSwitcherToggle).toHaveAttribute('aria-pressed', 'true');
    await expect(infoPanel).toBeVisible();
    await expect(infoPanelToggle).toHaveAttribute('aria-pressed', 'true');
    await expect(geocoderPanel).toBeVisible();
    await expect(geocoderInput).toBeVisible();
    await expect(weatherForecastSection).toBeVisible();
    await expect(measurementToggle).not.toHaveAttribute('aria-pressed', 'true');

    await expect.poll(() => getMapZoomLevel(page)).not.toBeUndefined();
    await expect.poll(() => getMapCenter(page)).not.toBeUndefined();
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(false);

    await expect(temperatureCheckbox).toBeChecked();
    await expect(precipitationCheckbox).not.toBeChecked();

    const initialCenter = (await getMapCenter(page))!;
    const initialZoom = (await getMapZoomLevel(page))!;

    await temperatureCheckbox.click({ force: true });
    await expect(temperatureCheckbox).not.toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);

    await precipitationCheckbox.click({ force: true });
    await expect(precipitationCheckbox).toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

    let forecastEntryCount: number | undefined;

    const extractForecastEntryCount = (value: unknown): number | undefined => {
        const visited = new WeakSet<object>();

        const visit = (node: unknown): number | undefined => {
            if (!node || typeof node !== 'object') {
                return undefined;
            }

            const objectNode = node as Record<string, unknown>;
            if (visited.has(objectNode)) {
                return undefined;
            }
            visited.add(objectNode);

            if (Array.isArray(node)) {
                if (node.length === 0) {
                    return undefined;
                }

                const firstEntry = node[0];
                if (firstEntry && typeof firstEntry === 'object') {
                    const keys = Object.keys(firstEntry as Record<string, unknown>).map((key) =>
                        key.toLowerCase()
                    );
                    const looksLikeForecastEntries =
                        keys.includes('time') ||
                        keys.includes('timestamp') ||
                        keys.includes('data') ||
                        keys.includes('instant') ||
                        keys.some((key) => key.includes('temperature')) ||
                        keys.some((key) => key.includes('precipitation'));

                    if (looksLikeForecastEntries) {
                        return node.length;
                    }
                }

                for (const item of node) {
                    const nestedResult = visit(item);
                    if (nestedResult !== undefined) {
                        return nestedResult;
                    }
                }

                return undefined;
            }

            for (const [key, nestedValue] of Object.entries(objectNode)) {
                const normalizedKey = key.toLowerCase();

                if (
                    Array.isArray(nestedValue) &&
                    (normalizedKey.includes('forecast') ||
                        normalizedKey.includes('hourly') ||
                        normalizedKey.includes('timeseries'))
                ) {
                    return nestedValue.length;
                }

                const nestedResult = visit(nestedValue);
                if (nestedResult !== undefined) {
                    return nestedResult;
                }
            }

            return undefined;
        };

        return visit(value);
    };

    page.on('response', async (response) => {
        const contentType = response.headers()['content-type'] ?? '';
        if (!contentType.toLowerCase().includes('json')) {
            return;
        }

        try {
            const json = await response.json();
            const extractedCount = extractForecastEntryCount(json);
            if (extractedCount !== undefined) {
                forecastEntryCount = extractedCount;
            }
        } catch {
            // Ignore non-JSON or unreadable responses.
        }
    });

    await geocoderInput.click();
    await geocoderInput.fill('Münster');

    const firstSearchResult = geocoderPanel.getByText(/Münster/i).first();
    await expect(firstSearchResult).toBeVisible();
    await firstSearchResult.click();

    await expect
        .poll(async () => {
            const center = await getMapCenter(page);
            return (
                !!center &&
                center[0] > 700000 &&
                center[0] < 1000000 &&
                center[1] > 6600000 &&
                center[1] < 7000000
            );
        })
        .toBe(true);

    await expect.poll(() => getMapZoomLevel(page)).toBeGreaterThan(initialZoom);

    await expect
        .poll(async () => {
            const center = await getMapCenter(page);
            return !!center && (center[0] !== initialCenter[0] || center[1] !== initialCenter[1]);
        })
        .toBe(true);

    await expect
        .poll(async () => {
            const highlightedCoordinate = await getHighlightedCoordinate(page);
            return (
                !!highlightedCoordinate &&
                highlightedCoordinate[0] > 700000 &&
                highlightedCoordinate[0] < 1000000 &&
                highlightedCoordinate[1] > 6600000 &&
                highlightedCoordinate[1] < 7000000
            );
        })
        .toBe(true);

    await expect(infoPanel).not.toContainText('Click on the map to load a forecast.');
    await expect(weatherForecastSection).toBeVisible();
    await expect.poll(() => forecastEntryCount, { timeout: 30000 }).toBe(24);
});
