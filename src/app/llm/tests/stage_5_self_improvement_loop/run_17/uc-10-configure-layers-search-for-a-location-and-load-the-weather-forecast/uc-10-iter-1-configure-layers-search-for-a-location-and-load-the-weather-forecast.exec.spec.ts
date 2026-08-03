// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getMapCenter, isLayerRendered } from "../../../../map-model-helpers";

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const layerSwitcher = page.getByTestId('layer-switcher');
    const infoPanel = page.getByTestId('info-panel');
    const geocoderPanel = page.getByTestId('geocoder-panel');
    const geocoderInput = page.getByTestId('geocoder-input');
    const measurementToggle = page.getByTestId('measurement-toggle');
    const weatherForecastSection = page.getByTestId('weather-forecast-section');
    const weatherForecast = page.getByTestId('weather-forecast');
    const weatherForecastEntries = page.getByTestId('weather-forecast-entry');

    const temperatureCheckbox = layerSwitcher.getByRole('checkbox', {
        name: 'Temperature',
        exact: true
    });
    const precipitationCheckbox = layerSwitcher.getByRole('checkbox', {
        name: 'Precipitation',
        exact: true
    });

    await expect(layerSwitcher).toBeVisible();
    await expect(infoPanel).toBeVisible();
    await expect(geocoderPanel).toBeVisible();
    await expect(geocoderInput).toBeVisible();
    await expect(weatherForecastSection).toBeVisible();
    await expect(measurementToggle).not.toHaveAttribute('aria-pressed', 'true');

    await expect(temperatureCheckbox).toBeChecked();
    await expect(precipitationCheckbox).not.toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Temperature'), { timeout: 15000 }).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'Precipitation'), { timeout: 15000 }).toBe(false);
    await expect.poll(() => getMapCenter(page), { timeout: 15000 }).toBeTruthy();

    const initialCenter = await getMapCenter(page);
    if (!initialCenter) {
        throw new Error('Map center was not available after application load.');
    }

    await temperatureCheckbox.click({ force: true });
    await expect(temperatureCheckbox).not.toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Temperature'), { timeout: 15000 }).toBe(false);

    await precipitationCheckbox.click({ force: true });
    await expect(precipitationCheckbox).toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Precipitation'), { timeout: 15000 }).toBe(true);

    await geocoderInput.click();
    await geocoderInput.fill('Münster');

    const resultButton = geocoderPanel.getByRole('button', { name: /Münster/i }).first();
    const resultOption = geocoderPanel.getByRole('option', { name: /Münster/i }).first();
    const resultListItem = geocoderPanel.getByRole('listitem').filter({ hasText: /Münster/i }).first();

    await expect.poll(async () => {
        if (await resultButton.isVisible()) return 'button';
        if (await resultOption.isVisible()) return 'option';
        if (await resultListItem.isVisible()) return 'listitem';
        return '';
    }, { timeout: 15000 }).not.toBe('');

    if (await resultButton.isVisible()) {
        await resultButton.click();
    } else if (await resultOption.isVisible()) {
        await resultOption.click();
    } else {
        await resultListItem.click();
    }

    await expect.poll(async () => {
        const currentCenter = await getMapCenter(page);
        if (!currentCenter) {
            return false;
        }

        return (
            Math.abs(currentCenter[0] - initialCenter[0]) > 1000 ||
            Math.abs(currentCenter[1] - initialCenter[1]) > 1000
        );
    }, { timeout: 20000 }).toBe(true);

    await expect(weatherForecastSection).toBeVisible();
    await expect(weatherForecast).toBeVisible();
    await expect(weatherForecast).toContainText(/Location:\s*Münster,\s*DE/i);
    await expect.poll(async () => await weatherForecastEntries.count(), { timeout: 30000 }).toBe(24);
});
