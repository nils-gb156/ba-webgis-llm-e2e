// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getMapCenter, getHighlightedCoordinate, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // 1. Hide the Temperature layer
    await page.getByTestId('layer-switcher').getByRole('checkbox', { name: 'Temperature' }).click({ force: true });

    // 2. Show the Precipitation layer
    await page.getByTestId('layer-switcher').getByRole('checkbox', { name: 'Precipitation' }).click({ force: true });

    // Verify layer visibility toggles
    await expect(page.getByTestId('layer-switcher').getByRole('checkbox', { name: 'Temperature' })).toBeChecked();
    await expect(page.getByTestId('layer-switcher').getByRole('checkbox', { name: 'Precipitation' })).not.toBeChecked();

    // Verify layer rendering state
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(false);

    // 3. Search for a place
    await page.getByTestId('geocoder-input').fill('Münster');

    // 4. Select the first result
    await page.getByTestId('geocoder-panel').getByRole('option').first().click();

    // 5. Wait for the map to navigate to the searched location
    await expect.poll(() => getMapCenter(page)).not.toBeUndefined();
    await expect.poll(() => getHighlightedCoordinate(page)).not.toBeUndefined();

    // 6. Wait for the info panel to load the forecast
    await expect(page.getByTestId('weather-forecast-section')).toBeVisible();

    // Verify the forecast has 24 entries
    await expect(page.getByTestId('weather-forecast-section').locator('li')).toHaveCount(24);
});
