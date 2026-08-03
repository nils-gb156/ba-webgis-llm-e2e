// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapCenter, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({
    page
}) => {
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
    await expect(geocoderInput).toBeEditable();
    await expect(measurementToggle).not.toHaveAttribute('aria-pressed', 'true');

    let initialCenter: [number, number] | undefined;
    await expect.poll(async () => {
        initialCenter = await getMapCenter(page);
        return initialCenter !== undefined;
    }).toBe(true);

    const temperatureCheckbox = page.getByRole('checkbox', {
        name: 'Temperature',
        exact: true
    });
    const precipitationCheckbox = page.getByRole('checkbox', {
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

    await geocoderInput.click();
    await geocoderInput.fill('Münster');

    await expect.poll(async () => {
        return await geocoderPanel.evaluate((panel) => {
            return panel.querySelectorAll('[role="option"], li').length;
        });
    }).toBeGreaterThan(0);

    await geocoderInput.press('ArrowDown');
    await geocoderInput.press('Enter');

    await expect(geocoderInput).toHaveValue(/Münster/i);

    await expect.poll(async () => {
        const center = await getMapCenter(page);
        if (!center || !initialCenter) {
            return 0;
        }

        return Math.hypot(center[0] - initialCenter[0], center[1] - initialCenter[1]);
    }).toBeGreaterThan(1000);

    await expect(weatherForecastSection).toBeVisible();
    await expect(weatherForecastSection).not.toContainText('Click on the map to load a forecast.');

    await expect.poll(async () => {
        return await weatherForecastSection.evaluate((section) => {
            return Math.max(
                section.querySelectorAll('[role="listitem"], li').length,
                section.querySelectorAll('article').length,
                section.querySelectorAll('time').length,
                section.querySelectorAll('img').length
            );
        });
    }).toBe(24);
});
