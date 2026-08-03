// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getMapCenter, getHighlightedCoordinate, isLayerRendered } from '../../../../map-model-helpers';

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
    await expect(weatherForecastSection).toContainText('Click on the map to load a forecast.');

    const temperatureCheckbox = layerSwitcher.getByRole('checkbox', {
        name: 'Temperature',
        exact: true
    });
    const precipitationCheckbox = layerSwitcher.getByRole('checkbox', {
        name: 'Precipitation',
        exact: true
    });

    await expect(temperatureCheckbox).toBeVisible();
    await expect(precipitationCheckbox).toBeVisible();

    await expect(temperatureCheckbox).toBeChecked();
    await expect(precipitationCheckbox).not.toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(false);

    await expect.poll(() => getMapCenter(page)).toBeDefined();
    const initialCenter = await getMapCenter(page);
    if (!initialCenter) {
        throw new Error('Map center was not available after the map became ready.');
    }

    await temperatureCheckbox.click({ force: true });
    await expect(temperatureCheckbox).not.toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);

    await precipitationCheckbox.click({ force: true });
    await expect(precipitationCheckbox).toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);
    await expect(page.getByTestId('precipitation-legend')).toBeVisible();

    let geocoderRequest: string | undefined;
    page.on('request', (request) => {
        const requestDetails = `${decodeURIComponent(request.url())} ${request.postData() ?? ''}`;
        if (requestDetails.toLowerCase().includes('münster')) {
            geocoderRequest = requestDetails;
        }
    });

    await geocoderInput.click();
    await geocoderInput.fill('Münster');
    await expect(page.getByTestId('geocoder-clear-button')).toBeVisible();
    await expect.poll(() => geocoderRequest, { timeout: 15000 }).toMatch(/münster/i);

    const searchResultOptions = geocoderPanel.getByRole('option').filter({ hasText: /M(?:ü|ue)nster/i });
    const searchResultButtons = geocoderPanel.getByRole('button').filter({ hasText: /M(?:ü|ue)nster/i });
    const searchResultListItems = geocoderPanel
        .getByRole('listitem')
        .filter({ hasText: /M(?:ü|ue)nster/i });

    await expect
        .poll(
            async () => {
                const optionCount = await searchResultOptions.count();
                if (optionCount > 0) {
                    return optionCount;
                }

                const buttonCount = await searchResultButtons.count();
                if (buttonCount > 0) {
                    return buttonCount;
                }

                return await searchResultListItems.count();
            },
            { timeout: 15000 }
        )
        .toBeGreaterThan(0);

    if ((await searchResultOptions.count()) > 0) {
        await expect(searchResultOptions.first()).toBeVisible();
        await searchResultOptions.first().click();
    } else if ((await searchResultButtons.count()) > 0) {
        await expect(searchResultButtons.first()).toBeVisible();
        await searchResultButtons.first().click();
    } else {
        await expect(searchResultListItems.first()).toBeVisible();
        await searchResultListItems.first().click();
    }

    await expect(geocoderInput).toHaveValue(/M(?:ü|ue)nster/i);

    await expect.poll(() => getHighlightedCoordinate(page), { timeout: 15000 }).toBeDefined();

    await expect
        .poll(
            async () => {
                const currentCenter = await getMapCenter(page);
                if (!currentCenter) {
                    return 0;
                }

                return Math.hypot(
                    currentCenter[0] - initialCenter[0],
                    currentCenter[1] - initialCenter[1]
                );
            },
            { timeout: 15000 }
        )
        .toBeGreaterThan(50000);

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
            { timeout: 15000 }
        )
        .toBeLessThan(5000);

    await expect(weatherForecastSection).toContainText(/Location:\s*M(?:ü|ue)nster\b/i, {
        timeout: 30000
    });
    await expect(weatherForecastSection).not.toContainText('Click on the map to load a forecast.', {
        timeout: 30000
    });

    const weatherForecast = page.getByTestId('weather-forecast');
    const forecastEntries = weatherForecastSection.getByTestId('weather-forecast-entry');

    await expect(weatherForecast).toBeVisible();
    await expect(forecastEntries).toHaveCount(24, { timeout: 30000 });
});
