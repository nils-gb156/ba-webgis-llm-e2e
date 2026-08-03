// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapCenter, getHighlightedCoordinate, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const layerSwitcher = page.getByTestId('layer-switcher');
    const infoPanel = page.getByTestId('info-panel');
    const measurementToggle = page.getByTestId('measurement-toggle');
    const geocoderInput = page.getByTestId('geocoder-input');
    const geocoderTextbox = page.getByRole('textbox', { name: 'Geocoder search', exact: true });
    const geocoderPanel = page.getByTestId('geocoder-panel');
    const weatherForecastSection = page.getByTestId('weather-forecast-section');

    await expect(layerSwitcher).toBeVisible();
    await expect(infoPanel).toBeVisible();
    await expect(geocoderInput).toBeVisible();
    await expect(geocoderTextbox).toBeVisible();
    await expect(geocoderTextbox).toBeEnabled();
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
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(false);
    await expect.poll(() => getMapCenter(page)).not.toBeUndefined();

    const initialCenter = await getMapCenter(page);
    if (!initialCenter) {
        throw new Error('Map center was not available after map initialization.');
    }

    await temperatureCheckbox.click({ force: true });
    await expect(temperatureCheckbox).not.toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);

    await precipitationCheckbox.click({ force: true });
    await expect(precipitationCheckbox).toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

    await geocoderTextbox.click();
    await geocoderTextbox.fill('Münster');
    await expect(geocoderPanel).toBeVisible();

    const optionResults = geocoderPanel.getByRole('option').filter({ hasText: /Münster/i });
    const listItemResults = geocoderPanel.getByRole('listitem').filter({ hasText: /Münster/i });
    const buttonResults = geocoderPanel.getByRole('button').filter({ hasText: /Münster/i });

    await expect
        .poll(
            async () =>
                (await optionResults.count()) +
                (await listItemResults.count()) +
                (await buttonResults.count()),
            { timeout: 15000 }
        )
        .toBeGreaterThan(0);

    if ((await optionResults.count()) > 0) {
        await expect(optionResults.first()).toBeVisible();
        await optionResults.first().click();
    } else if ((await listItemResults.count()) > 0) {
        await expect(listItemResults.first()).toBeVisible();
        await listItemResults.first().click();
    } else {
        await expect(buttonResults.first()).toBeVisible();
        await buttonResults.first().click();
    }

    await expect(geocoderTextbox).toHaveValue(/Münster/i);

    await expect
        .poll(
            async () => {
                const highlighted = await getHighlightedCoordinate(page);
                if (!highlighted) {
                    return false;
                }

                const [x, y] = highlighted;
                return x > 780000 && x < 920000 && y > 6700000 && y < 6900000;
            },
            { timeout: 20000 }
        )
        .toBe(true);

    await expect
        .poll(
            async () => {
                const center = await getMapCenter(page);
                if (!center) {
                    return false;
                }

                const dx = center[0] - initialCenter[0];
                const dy = center[1] - initialCenter[1];
                return Math.hypot(dx, dy) > 1000;
            },
            { timeout: 20000 }
        )
        .toBe(true);

    await expect
        .poll(
            async () => {
                const center = await getMapCenter(page);
                const highlighted = await getHighlightedCoordinate(page);
                if (!center || !highlighted) {
                    return false;
                }

                const dx = center[0] - highlighted[0];
                const dy = center[1] - highlighted[1];
                return Math.hypot(dx, dy) < 100000;
            },
            { timeout: 20000 }
        )
        .toBe(true);

    await expect(weatherForecastSection).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Weather Forecast', exact: true })).toBeVisible();
    await expect(infoPanel).toContainText(/Location:\s*Münster,\s*DE/i);
    await expect(weatherForecastSection).not.toContainText('Click on the map to load a forecast.');
    await expect(weatherForecastSection.getByTestId('weather-forecast-entry')).toHaveCount(24, {
        timeout: 20000
    });
});
