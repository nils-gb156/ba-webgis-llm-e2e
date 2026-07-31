// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered, getMapCenter, getHighlightedCoordinate } from '../../../../map-model-helpers';

test('UC10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Step 1: Hide the Temperature overlay layer
    // The initial state has Temperature checked. We click to uncheck it.
    await page.getByRole('checkbox', { name: 'Temperature' }).click({ force: true });
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);

    // Step 2: Show the Precipitation overlay layer
    // The initial state has Precipitation unchecked. We click to check it.
    await page.getByRole('checkbox', { name: 'Precipitation' }).click({ force: true });
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

    // Step 3: Search for a location using the geocoder
    const geocoderInput = page.getByRole('textbox', { name: 'Geocoder search' });
    await geocoderInput.click();
    await geocoderInput.fill('Münster');

    // Step 4: Wait for the result list to appear and select the first result.
    // The geocoder panel becomes visible with results. We look for the first list item inside it.
    const geocoderPanel = page.getByTestId('geocoder-panel');
    await expect(geocoderPanel).toBeVisible();
    
    // The first result is typically a list item within the panel.
    // We use a generic role-based locator scoped to the panel to find the first selectable item.
    const firstResult = geocoderPanel.getByRole('option', { name: 'Münster' }).first();
    // If 'option' role isn't used, fallback to listitem or button inside the panel.
    // Based on typical geocoder implementations, results might be listitems or buttons.
    // Let's try to find a clickable element that matches the search term.
    if (!(await firstResult.isVisible())) {
        // Fallback: look for any listitem or button in the geocoder panel that contains "Münster"
        const resultItem = geocoderPanel.getByText('Münster').first();
        await resultItem.click();
    } else {
        await firstResult.click();
    }

    // Step 5: Wait for the map to navigate to the selected location.
    // We verify the map center has changed from the initial extent.
    // Initial extent is roughly centered on Germany (approx [4e6, 5.5e6] in EPSG:3857).
    // Münster is at approx [674000, 6580000].
    // We wait for the center to be closer to Münster's coordinates.
    await expect.poll(() => {
        const center = getMapCenter(page);
        if (!center) return false;
        // Check if the x coordinate is in the range of Münster (approx 600k to 750k)
        // and y coordinate is in the range (approx 6.5M)
        return center[0] > 600000 && center[0] < 750000 && center[1] > 6500000 && center[1] < 6700000;
    }).toBe(true);

    // Step 6: Wait for the info panel to load the forecast.
    // The expected result states "24 entries".
    const forecastSection = page.getByTestId('weather-forecast-section');
    
    // Wait for the section to be visible
    await expect(forecastSection).toBeVisible();
    
    // Wait for the heading to be visible
    await expect(forecastSection.getByRole('heading', { name: 'Weather Forecast' })).toBeVisible();
    
    // Wait for the list items to appear. We expect 24 entries.
    // We'll wait for at least one to be visible first, then assert the count.
    await expect(forecastSection.getByRole('listitem').first()).toBeVisible();
    
    // Assert that there are exactly 24 list items as per the expected result
    await expect.poll(() => forecastSection.getByRole('listitem').count()).toBe(24);
});
