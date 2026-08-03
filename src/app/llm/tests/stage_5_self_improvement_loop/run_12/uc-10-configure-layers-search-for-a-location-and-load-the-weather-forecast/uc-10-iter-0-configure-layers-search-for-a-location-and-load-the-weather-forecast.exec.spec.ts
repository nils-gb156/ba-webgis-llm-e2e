// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
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
    const geocoderInput = page.getByRole('textbox', { name: 'Geocoder search', exact: true });
    const measurementToggle = page.getByTestId('measurement-toggle');

    await expect(layerSwitcher).toBeVisible();
    await expect(infoPanel).toBeVisible();
    await expect(geocoderInput).toBeVisible();
    await expect(geocoderInput).toBeEnabled();
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

    let initialCenter: [number, number] | undefined;
    await expect
        .poll(async () => {
            initialCenter = await getMapCenter(page);
            return initialCenter;
        })
        .not.toBeUndefined();

    await temperatureCheckbox.click({ force: true });
    await expect(temperatureCheckbox).not.toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);

    await precipitationCheckbox.click({ force: true });
    await expect(precipitationCheckbox).toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

    await geocoderInput.click();
    await geocoderInput.fill('Münster');

    const geocoderPanel = page.getByTestId('geocoder-panel');
    await expect(geocoderPanel).toBeVisible();

    await expect
        .poll(async () => {
            const optionCount = await geocoderPanel.getByRole('option').count();
            const listItemCount = await geocoderPanel.getByRole('listitem').count();
            const buttonCount = await geocoderPanel.locator('[role="button"], button').count();
            return Math.max(optionCount, listItemCount, buttonCount);
        })
        .toBeGreaterThan(0);

    let firstResult = geocoderPanel.getByRole('option').first();
    if ((await geocoderPanel.getByRole('option').count()) === 0) {
        if ((await geocoderPanel.getByRole('listitem').count()) > 0) {
            firstResult = geocoderPanel.getByRole('listitem').first();
        } else {
            firstResult = geocoderPanel.locator('[role="button"], button').first();
        }
    }

    await expect(firstResult).toBeVisible();
    await firstResult.click();

    await expect
        .poll(async () => {
            const center = await getMapCenter(page);
            if (!center || !initialCenter) {
                return false;
            }
            return center[0] !== initialCenter[0] || center[1] !== initialCenter[1];
        })
        .toBe(true);

    await expect.poll(() => getHighlightedCoordinate(page)).not.toBeUndefined();

    const weatherForecastSection = page.getByTestId('weather-forecast-section');
    await expect(weatherForecastSection).toBeVisible();
    await expect(
        weatherForecastSection.getByRole('heading', { name: 'Weather Forecast', exact: true })
    ).toBeVisible();

    await expect
        .poll(async () => {
            return await weatherForecastSection.evaluate((section) => {
                const counts = [
                    section.querySelectorAll('[role="listitem"]').length,
                    section.querySelectorAll('li').length,
                    section.querySelectorAll('tbody tr').length,
                    section.querySelectorAll('article').length,
                    section.querySelectorAll('button').length
                ];
                return Math.max(...counts);
            });
        })
        .toBe(24);
});
