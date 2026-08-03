// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getHighlightedCoordinate, getMapCenter, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const layerSwitcher = page.getByTestId('layer-switcher');
    const infoPanel = page.getByTestId('info-panel');
    const geocoderInput = page.getByTestId('geocoder-input');
    const weatherForecastSection = page.getByTestId('weather-forecast-section');
    const measurementToggle = page.getByTestId('measurement-toggle');

    const temperatureCheckbox = layerSwitcher.getByRole('checkbox', { name: 'Temperature', exact: true });
    const precipitationCheckbox = layerSwitcher.getByRole('checkbox', { name: 'Precipitation', exact: true });

    await expect(layerSwitcher).toBeVisible();
    await expect(infoPanel).toBeVisible();
    await expect(geocoderInput).toBeVisible();
    await expect(weatherForecastSection).toBeVisible();
    await expect(measurementToggle).not.toHaveAttribute('aria-pressed', 'true');

    await expect(temperatureCheckbox).toBeChecked();
    await expect(precipitationCheckbox).not.toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(false);
    await expect(weatherForecastSection).toContainText('Click on the map to load a forecast.');

    await expect.poll(() => getMapCenter(page)).not.toBeUndefined();
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

    await geocoderInput.click();
    await geocoderInput.fill('Münster');

    const optionResults = page.getByRole('option').filter({ hasText: /Münster/i });
    const linkResults = page.getByRole('link').filter({ hasText: /Münster/i });
    const buttonResults = page.getByRole('button').filter({ hasText: /Münster/i });
    const listItemResults = page.getByRole('listitem').filter({ hasText: /Münster/i });

    await expect.poll(async () => {
        const counts = [
            await optionResults.count(),
            await linkResults.count(),
            await buttonResults.count(),
            await listItemResults.count()
        ];
        return Math.max(...counts);
    }, { timeout: 15000 }).toBeGreaterThan(0);

    if ((await optionResults.count()) > 0) {
        await optionResults.first().click();
    } else if ((await linkResults.count()) > 0) {
        await linkResults.first().click();
    } else if ((await buttonResults.count()) > 0) {
        await buttonResults.first().click();
    } else {
        await listItemResults.first().click();
    }

    await expect.poll(async () => {
        const currentCenter = await getMapCenter(page);
        if (!currentCenter) {
            return 0;
        }
        const dx = currentCenter[0] - initialCenter[0];
        const dy = currentCenter[1] - initialCenter[1];
        return Math.sqrt(dx * dx + dy * dy);
    }, { timeout: 15000 }).toBeGreaterThan(1000);

    await expect.poll(() => getHighlightedCoordinate(page), { timeout: 15000 }).not.toBeUndefined();

    await expect(weatherForecastSection).not.toContainText('Click on the map to load a forecast.');
    await expect(weatherForecastSection).toContainText(/Location:\s*Münster/i, { timeout: 15000 });
    await expect(page.getByTestId('weather-forecast-entry')).toHaveCount(24, { timeout: 15000 });
});
