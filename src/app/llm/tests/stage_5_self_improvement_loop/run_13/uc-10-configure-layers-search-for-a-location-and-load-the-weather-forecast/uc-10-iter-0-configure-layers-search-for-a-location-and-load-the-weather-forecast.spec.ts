// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapCenter, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // 1. Hide the Temperature overlay layer
    await page.getByRole('checkbox', { name: 'Temperature' }).click({ force: true });

    // 2. Show the Precipitation overlay layer
    await page.getByRole('checkbox', { name: 'Precipitation' }).click({ force: true });

    // 3. Search for a location
    const geocoderInput = page.getByRole('textbox', { name: 'Geocoder search' });
    await geocoderInput.fill('Münster');

    // 4. Select the first result
    await page.getByRole('option', { name: 'Münster', exact: true }).first().click();

    // 5. Wait for the map to navigate to the searched location (center should change)
    await expect.poll(() => getMapCenter(page)).not.toBeUndefined();

    // 6. Wait for the info panel to load the forecast
    await expect(page.getByTestId('weather-forecast-section')).toBeVisible();

    // Expected results:
    // - Precipitation layer is not rendered
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(false);

    // - Temperature layer is rendered
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);

    // - Info panel displays a weather forecast section with 24 entries
    const weatherSection = page.getByTestId('weather-forecast-section');
    await expect(weatherSection).toBeVisible();
    await expect(weatherSection.getByRole('list')).toBeVisible();
    await expect(weatherSection.getByRole('listitem')).toHaveCount(24);
});
