// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import {
    getMapCenter,
    getHighlightedCoordinate,
    isLayerRendered
} from '../../../../map-model-helpers';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({
    page
}) => {
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

    await temperatureCheckbox.click({ force: true });
    await expect(temperatureCheckbox).not.toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);

    await precipitationCheckbox.click({ force: true });
    await expect(precipitationCheckbox).toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

    await expect(page.getByTestId('precipitation-legend')).toBeVisible();
    await expect(page.getByTestId('temperature-legend')).toBeHidden();

    await geocoderTextbox.click();
    await geocoderTextbox.fill('Münster');
    await expect(geocoderPanel).toBeVisible();

    const optionResults = page.getByRole('option', { name: /Münster/i });
    const listItemResults = geocoderPanel.getByRole('listitem').filter({ hasText: /Münster/i });
    const textResults = geocoderPanel.getByText(/Münster/i);

    await expect
        .poll(
            async () => {
                const optionCount = await optionResults.count();
                if (optionCount > 0) {
                    return optionCount;
                }

                const listItemCount = await listItemResults.count();
                if (listItemCount > 0) {
                    return listItemCount;
                }

                return await textResults.count();
            },
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
        await expect(textResults.first()).toBeVisible();
        await textResults.first().click();
    }

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
                const highlighted = await getHighlightedCoordinate(page);
                if (!center || !highlighted) {
                    return false;
                }

                const dx = center[0] - highlighted[0];
                const dy = center[1] - highlighted[1];
                return Math.sqrt(dx * dx + dy * dy) < 100000;
            },
            { timeout: 20000 }
        )
        .toBe(true);

    await expect(weatherForecastSection).toBeVisible();
    await expect(
        weatherForecastSection.getByRole('heading', { name: 'Weather Forecast', exact: true })
    ).toBeVisible();

    await expect
        .poll(
            async () => (await weatherForecastSection.textContent()) ?? '',
            { timeout: 20000 }
        )
        .not.toContain('Click on the map to load a forecast.');

    await expect
        .poll(
            async () => {
                return await weatherForecastSection.evaluate((section) => {
                    const tableBodyRows = section.querySelectorAll('tbody tr').length;
                    if (tableBodyRows > 0) {
                        return tableBodyRows;
                    }

                    const listItems =
                        section.querySelectorAll('[role="listitem"]').length ||
                        section.querySelectorAll('li').length;
                    if (listItems > 0) {
                        return listItems;
                    }

                    const articles = section.querySelectorAll('article').length;
                    if (articles > 0) {
                        return articles;
                    }

                    const buttons = section.querySelectorAll('button').length;
                    if (buttons > 0) {
                        return buttons;
                    }

                    const tableRows = section.querySelectorAll('table tr').length;
                    if (tableRows > 1) {
                        return tableRows - 1;
                    }

                    return 0;
                });
            },
            { timeout: 20000 }
        )
        .toBe(24);
});
