// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getMapCenter, getHighlightedCoordinate, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const layerSwitcher = page.getByTestId('layer-switcher');
    const infoPanel = page.getByTestId('info-panel');
    const weatherForecastSection = page.getByTestId('weather-forecast-section');
    const geocoderPanel = page.getByTestId('geocoder-panel');
    const geocoderInput = page.getByTestId('geocoder-input');
    const measurementToggle = page.getByTestId('measurement-toggle');

    const temperatureCheckbox = page.getByRole('checkbox', { name: 'Temperature', exact: true });
    const precipitationCheckbox = page.getByRole('checkbox', { name: 'Precipitation', exact: true });

    await expect(layerSwitcher).toBeVisible();
    await expect(infoPanel).toBeVisible();
    await expect(weatherForecastSection).toBeVisible();
    await expect(geocoderPanel).toBeVisible();
    await expect(geocoderInput).toBeVisible();
    await expect(geocoderInput).toBeEnabled();
    await expect(measurementToggle).not.toHaveAttribute('aria-pressed', 'true');

    await expect(temperatureCheckbox).toBeVisible();
    await expect(temperatureCheckbox).toBeChecked();
    await expect(precipitationCheckbox).toBeVisible();
    await expect(precipitationCheckbox).not.toBeChecked();

    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(false);

    let centerBeforeSearch: [number, number] | undefined;
    await expect
        .poll(async () => {
            centerBeforeSearch = await getMapCenter(page);
            return centerBeforeSearch;
        })
        .not.toBeUndefined();

    if (!centerBeforeSearch) {
        throw new Error('Map center was not available before the search.');
    }

    await temperatureCheckbox.click({ force: true });
    await expect(temperatureCheckbox).not.toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);

    await precipitationCheckbox.click({ force: true });
    await expect(precipitationCheckbox).toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

    const extractForecastEntryCount = (value: unknown): number | undefined => {
        if (Array.isArray(value)) {
            if (
                value.length === 24 &&
                value.every(
                    (entry) =>
                        entry !== null &&
                        typeof entry === 'object' &&
                        (('time' in (entry as Record<string, unknown>)) ||
                            ('temperature' in (entry as Record<string, unknown>)) ||
                            ('precipitation' in (entry as Record<string, unknown>)) ||
                            ('icon' in (entry as Record<string, unknown>)))
                )
            ) {
                return 24;
            }

            for (const item of value) {
                const nested = extractForecastEntryCount(item);
                if (nested !== undefined) {
                    return nested;
                }
            }

            return undefined;
        }

        if (value !== null && typeof value === 'object') {
            for (const [key, nestedValue] of Object.entries(value as Record<string, unknown>)) {
                if (
                    Array.isArray(nestedValue) &&
                    nestedValue.length === 24 &&
                    /forecast|hourly|timeseries|entries|items|data/i.test(key)
                ) {
                    return 24;
                }

                const nested = extractForecastEntryCount(nestedValue);
                if (nested !== undefined) {
                    return nested;
                }
            }
        }

        return undefined;
    };

    let forecastEntryCountFromResponse: number | undefined;
    page.on('response', async (response) => {
        if (!response.ok()) {
            return;
        }

        const contentType = response.headers()['content-type'] ?? '';
        if (!contentType.includes('json')) {
            return;
        }

        try {
            const data = await response.json();
            const count = extractForecastEntryCount(data);
            if (count !== undefined) {
                forecastEntryCountFromResponse = count;
            }
        } catch {
            // Ignore non-JSON or unparsable responses.
        }
    });

    await geocoderInput.click();
    await geocoderInput.fill('Münster');

    const firstSearchResult = geocoderPanel.getByText(/Münster/i).first();
    await expect(firstSearchResult).toBeVisible();
    await firstSearchResult.click();

    await expect
        .poll(async () => {
            const currentCenter = await getMapCenter(page);
            if (!currentCenter) {
                return false;
            }

            const dx = currentCenter[0] - centerBeforeSearch[0];
            const dy = currentCenter[1] - centerBeforeSearch[1];
            return Math.hypot(dx, dy) > 50000;
        })
        .toBe(true);

    await expect
        .poll(async () => {
            const currentCenter = await getMapCenter(page);
            const highlightedCoordinate = await getHighlightedCoordinate(page);

            if (!currentCenter || !highlightedCoordinate) {
                return false;
            }

            const dx = currentCenter[0] - highlightedCoordinate[0];
            const dy = currentCenter[1] - highlightedCoordinate[1];
            return Math.hypot(dx, dy) < 20000;
        })
        .toBe(true);

    await expect(weatherForecastSection).not.toContainText('Click on the map to load a forecast.');

    await expect
        .poll(async () => {
            if (forecastEntryCountFromResponse === 24) {
                return 24;
            }

            return await weatherForecastSection.evaluate((section) => {
                const candidateCounts = [
                    section.querySelectorAll('[role="listitem"]').length,
                    section.querySelectorAll('li').length,
                    section.querySelectorAll('[role="row"]').length,
                    section.querySelectorAll('tbody tr').length,
                    section.querySelectorAll('article').length
                ].filter((count) => count > 0);

                const text = section.textContent ?? '';
                const hourlyTimeMatches = text.match(/\b(?:[01]\d|2[0-3]):\d{2}\b/g) ?? [];
                if (hourlyTimeMatches.length > 0) {
                    candidateCounts.push(hourlyTimeMatches.length);
                }

                return candidateCounts.includes(24) ? 24 : 0;
            });
        })
        .toBe(24);
});
