// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getMapCenter, getHighlightedCoordinate, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const layerSwitcher = page.getByTestId('layer-switcher');
    const infoPanel = page.getByTestId('info-panel');
    const geocoderInput = page.getByTestId('geocoder-input');
    const geocoderPanel = page.getByTestId('geocoder-panel');
    const weatherForecastSection = page.getByTestId('weather-forecast-section');
    const measurementToggle = page.getByTestId('measurement-toggle');
    const temperatureLegend = page.getByTestId('temperature-legend');
    const precipitationLegend = page.getByTestId('precipitation-legend');

    await expect(layerSwitcher).toBeVisible();
    await expect(infoPanel).toBeVisible();
    await expect(geocoderInput).toBeVisible();
    await expect(weatherForecastSection).toBeVisible();
    await expect(measurementToggle).not.toHaveAttribute('aria-pressed', 'true');

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
    await expect(temperatureLegend).toBeVisible();
    await expect(precipitationLegend).toBeHidden();
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(false);
    await expect(infoPanel).toContainText('Click on the map to load a forecast.');

    await expect.poll(() => getMapCenter(page)).toBeDefined();
    const initialCenter = await getMapCenter(page);
    expect(initialCenter).toBeDefined();

    await temperatureCheckbox.click({ force: true });
    await expect(temperatureCheckbox).not.toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);
    await expect(temperatureLegend).toBeHidden();

    await precipitationCheckbox.click({ force: true });
    await expect(precipitationCheckbox).toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);
    await expect(precipitationLegend).toBeVisible();

    await geocoderInput.click();
    await geocoderInput.fill('Münster');

    await expect(geocoderPanel).toBeVisible();
    await expect
        .poll(
            async () => ((await geocoderPanel.textContent()) ?? '').replace(/\s+/g, ' ').trim(),
            { timeout: 20000 }
        )
        .toMatch(/M[uü]nster/i);

    const firstSearchResult = geocoderPanel.getByText(/M[uü]nster/i).first();
    await expect(firstSearchResult).toBeVisible();
    await firstSearchResult.click();

    await expect.poll(() => getHighlightedCoordinate(page), { timeout: 20000 }).toBeDefined();

    await expect
        .poll(
            async () => {
                const currentCenter = await getMapCenter(page);
                if (!initialCenter || !currentCenter) {
                    return 0;
                }
                return Math.hypot(
                    currentCenter[0] - initialCenter[0],
                    currentCenter[1] - initialCenter[1]
                );
            },
            { timeout: 20000 }
        )
        .toBeGreaterThan(1000);

    await expect
        .poll(
            async () => {
                const currentCenter = await getMapCenter(page);
                const highlightedCoordinate = await getHighlightedCoordinate(page);
                if (!currentCenter || !highlightedCoordinate) {
                    return Number.POSITIVE_INFINITY;
                }
                return Math.hypot(
                    currentCenter[0] - highlightedCoordinate[0],
                    currentCenter[1] - highlightedCoordinate[1]
                );
            },
            { timeout: 20000 }
        )
        .toBeLessThan(100000);

    await expect
        .poll(async () => (await infoPanel.textContent()) ?? '', { timeout: 20000 })
        .not.toContain('Click on the map to load a forecast.');

    await expect(weatherForecastSection).toBeVisible();
    await expect
        .poll(
            async () =>
                await weatherForecastSection.evaluate((section) => {
                    const explicitCount = [
                        section.querySelectorAll('[role="listitem"]').length,
                        section.querySelectorAll('li').length,
                        section.querySelectorAll('article').length,
                        section.querySelectorAll('tbody tr').length
                    ].find((count) => count > 0);

                    if (explicitCount) {
                        return explicitCount;
                    }

                    const text = section.textContent ?? '';
                    const timeMatches = text.match(/\b\d{1,2}:\d{2}\b/g) ?? [];
                    return new Set(timeMatches).size;
                }),
            { timeout: 20000 }
        )
        .toBe(24);
});
