// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapCenter, getHighlightedCoordinate, isLayerRendered } from '../../../map-model-helpers';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    await expect(page.getByTestId('layer-switcher')).toBeVisible();
    await expect(page.getByTestId('info-panel')).toBeVisible();
    await expect(page.getByTestId('geocoder-input')).toBeVisible();
    await expect(page.getByTestId('measurement-panel')).toBeHidden();

    await expect.poll(() => getMapCenter(page)).not.toBeUndefined();
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(false);

    const layerSwitcher = page.getByTestId('layer-switcher');
    const temperatureToggle = layerSwitcher.getByRole('checkbox', { name: 'Temperature', exact: true });
    const precipitationToggle = layerSwitcher.getByRole('checkbox', { name: 'Precipitation', exact: true });

    await expect(temperatureToggle).toBeChecked();
    await expect(precipitationToggle).not.toBeChecked();

    await temperatureToggle.click({ force: true });
    await precipitationToggle.click({ force: true });

    await expect(temperatureToggle).not.toBeChecked();
    await expect(precipitationToggle).toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

    const initialCenter = await getMapCenter(page);
    if (!initialCenter) {
        throw new Error('Map center was not available before selecting the geocoder result.');
    }

    const geocoderInput = page.getByTestId('geocoder-input');
    await geocoderInput.click();
    await geocoderInput.fill('Münster');

    await expect(page.getByTestId('geocoder-results')).toBeVisible();
    const firstResult = page.getByTestId('geocoder-result-item-0');
    await expect(firstResult).toBeVisible();
    await firstResult.click();

    await expect.poll(() => getHighlightedCoordinate(page)).not.toBeUndefined();
    await expect.poll(async () => {
        const center = await getMapCenter(page);
        if (!center) {
            return false;
        }
        return Math.abs(center[0] - initialCenter[0]) > 1 || Math.abs(center[1] - initialCenter[1]) > 1;
    }).toBe(true);

    await expect(page.getByTestId('weather-forecast-section')).toBeVisible();
    await expect(page.getByTestId('weather-forecast-entry')).toHaveCount(24);
});
