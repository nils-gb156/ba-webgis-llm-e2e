// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapZoomLevel, getMapCenter } from '../../../map-model-helpers';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // 1. Hide the Temperature overlay layer
    await page.getByTestId('layer-switcher').getByRole('checkbox', { name: 'Temperature' }).click({ force: true });

    // 2. Show the Precipitation overlay layer
    await page.getByTestId('layer-switcher').getByRole('checkbox', { name: 'Precipitation' }).click({ force: true });

    // 3. Search for 'Münster'
    await page.getByTestId('geocoder-input').click();
    await page.getByTestId('geocoder-input').fill('Münster');

    // 4. Wait for results and select the first one
    await expect(page.getByTestId('geocoder-result-item-0')).toBeVisible();
    await page.getByTestId('geocoder-result-item-0').click();

    // 5. Wait for the map to navigate to the selected location
    // We check that the zoom level has changed from the default or that the center is not the initial one.
    // Since we don't know the exact initial center, we just wait for the map to settle on a new view.
    const initialCenter = await getMapCenter(page);
    await expect.poll(() => getMapCenter(page)).not.toEqual(initialCenter);

    // 6. Wait for the info panel to load the forecast
    // The forecast section appears after clicking the map or selecting a geocoder result,
    // and loads asynchronously.
    await expect(page.getByTestId('weather-forecast')).toBeVisible();

    // Expected result: The info panel displays a weather forecast section with 24 entries.
    await expect(page.getByTestId('weather-forecast').getByTestId('weather-forecast-entry')).toHaveCount(24);

    // Expected result: The Precipitation overlay layer toggle is in the disabled state (checked/active).
    // Note: Chakra Checkbox checked state corresponds to "enabled" visibility.
    await expect(page.getByTestId('layer-switcher').getByRole('checkbox', { name: 'Precipitation' })).toBeChecked();

    // Expected result: The Temperature overlay layer toggle is in the enabled state (unchecked/inactive).
    await expect(page.getByTestId('layer-switcher').getByRole('checkbox', { name: 'Temperature' })).not.toBeChecked();
});
