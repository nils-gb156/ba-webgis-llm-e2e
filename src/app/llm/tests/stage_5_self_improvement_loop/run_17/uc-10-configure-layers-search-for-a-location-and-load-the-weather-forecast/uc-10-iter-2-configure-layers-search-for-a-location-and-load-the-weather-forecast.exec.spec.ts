// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getMapCenter, getHighlightedCoordinate, isLayerRendered } from "../../../../map-model-helpers";

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const layerSwitcher = page.getByTestId('layer-switcher');
    const layerSwitcherToggle = page.getByTestId('layer-switcher-toggle');
    const infoPanel = page.getByTestId('info-panel');
    const infoPanelToggle = page.getByTestId('info-panel-toggle');
    const geocoderPanel = page.getByTestId('geocoder-panel');
    const geocoderInput = page.getByTestId('geocoder-input');
    const measurementToggle = page.getByTestId('measurement-toggle');
    const weatherForecastSection = page.getByTestId('weather-forecast-section');
    const weatherForecast = page.getByTestId('weather-forecast');
    const weatherForecastEntries = page.getByTestId('weather-forecast-entry');

    if (!(await layerSwitcher.isVisible())) {
        await layerSwitcherToggle.click();
    }
    await expect(layerSwitcher).toBeVisible();

    if (!(await infoPanel.isVisible())) {
        await infoPanelToggle.click();
    }
    await expect(infoPanel).toBeVisible();

    await expect(geocoderPanel).toBeVisible();
    await expect(geocoderInput).toBeVisible();
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
    await expect.poll(() => isLayerRendered(page, 'Temperature'), { timeout: 15000 }).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'Precipitation'), { timeout: 15000 }).toBe(false);
    await expect.poll(() => getMapCenter(page), { timeout: 15000 }).not.toBeUndefined();

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

    const searchResultButton = geocoderPanel.getByRole('button', { name: /M.*nster/i }).first();
    const searchResultOption = geocoderPanel.getByRole('option', { name: /M.*nster/i }).first();
    const searchResultListItem = geocoderPanel.getByRole('listitem').filter({ hasText: /M.*nster/i }).first();
    const searchResultText = geocoderPanel.getByText(/M.*nster/i).first();

    await expect.poll(async () => {
        if (await searchResultButton.count()) return 'button';
        if (await searchResultOption.count()) return 'option';
        if (await searchResultListItem.count()) return 'listitem';
        if (await searchResultText.count()) return 'text';
        return '';
    }, { timeout: 15000 }).not.toBe('');

    if (await searchResultButton.count()) {
        await searchResultButton.click();
    } else if (await searchResultOption.count()) {
        await searchResultOption.click();
    } else if (await searchResultListItem.count()) {
        await searchResultListItem.click();
    } else {
        await searchResultText.click();
    }

    await expect(geocoderInput).toHaveValue(/M.*nster.*Germany/i);

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

    await expect.poll(() => getHighlightedCoordinate(page), { timeout: 20000 }).not.toBeUndefined();

    await expect(weatherForecastSection).toBeVisible();
    await expect(weatherForecast).toBeVisible();
    await expect(infoPanel.getByText('Click on the map to load a forecast.')).toHaveCount(0);
    await expect(weatherForecastSection.getByText(/^Location:\s*.+,\s*DE$/)).toBeVisible();
    await expect.poll(async () => await weatherForecastEntries.count(), { timeout: 30000 }).toBe(24);
});
