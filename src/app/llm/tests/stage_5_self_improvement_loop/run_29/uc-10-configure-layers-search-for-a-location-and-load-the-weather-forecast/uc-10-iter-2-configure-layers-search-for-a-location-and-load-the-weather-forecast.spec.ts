// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';
import { isLayerRendered, getHighlightedCoordinate } from '../../../../map-model-helpers';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // 1. Hide Temperature overlay
    // Chakra UI checkbox intercepts pointer events on the decorative control element.
    // Use force: true to click the underlying role-bearing input.
    const temperatureCheckbox = page.getByRole('checkbox', { name: 'Temperature' });
    await temperatureCheckbox.click({ force: true });
    await expect(temperatureCheckbox).not.toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);

    // 2. Show Precipitation overlay
    const precipitationCheckbox = page.getByRole('checkbox', { name: 'Precipitation' });
    await precipitationCheckbox.click({ force: true });
    await expect(precipitationCheckbox).toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

    // 3. Search for a location
    const geocoderInput = page.getByRole('textbox', { name: 'Geocoder search' });
    await geocoderInput.fill('Münster');

    // 4. Select first result
    // The geocoder results are rendered as a list with test-id "geocoder-results".
    // Each result item has a test-id like "geocoder-result-item-0".
    const firstResult = page.getByTestId('geocoder-result-item-0');
    await firstResult.click();

    // 5. Wait for map to navigate to the searched location (highlight appears).
    await expect.poll(() => getHighlightedCoordinate(page)).toBeDefined();

    // 6. Wait for forecast to load (24 entries in the weather forecast section).
    await expect.poll(async () => {
        const section = page.getByTestId('weather-forecast-section');
        const items = section.getByRole('listitem');
        const count = await items.count();
        return count;
    }).toBe(24);
});
