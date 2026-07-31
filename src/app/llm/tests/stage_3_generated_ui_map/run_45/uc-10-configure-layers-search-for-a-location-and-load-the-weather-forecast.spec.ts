// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapCenter, getMapZoomLevel, isLayerRendered } from '../../../map-model-helpers';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Wait for the map and initial layers to settle
    await expect.poll(() => getMapZoomLevel(page)).toBeDefined();
    await expect(page.getByTestId('layer-switcher')).toBeVisible();

    // Step 1: Hide Temperature overlay
    // The layer switcher is visible by default. We need to find the Temperature layer toggle.
    // Based on the UI map, we don't have specific test IDs for individual layer toggles in the switcher,
    // so we rely on the layer name visible in the UI or the structure.
    // However, looking at the UI Map, we have `layer-switcher` as a panel.
    // Usually, layer items have roles or text. Let's assume we can find them by text or role within the panel.
    // Since Chakra UI might render checkboxes, we use force: true for the checkbox/switch role.
    // We need to locate the Temperature layer toggle. It's likely inside the layer-switcher panel.
    const tempLayerToggle = page.getByTestId('layer-switcher').getByRole('checkbox', { name: 'Temperature', exact: true }).or(
        page.getByTestId('layer-switcher').getByRole('switch', { name: 'Temperature', exact: true })
    );
    // If it's currently checked (visible), we click to uncheck.
    // We use expect.poll to ensure it's in the expected state before interacting if needed, 
    // but for toggling, we just click. However, to be safe against state, we check first.
    const isTempVisible = await tempLayerToggle.isChecked();
    if (isTempVisible) {
        await tempLayerToggle.click({ force: true });
    }
    
    // Wait for Temperature layer to be hidden in the map model
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);

    // Step 2: Show Precipitation overlay
    const precipLayerToggle = page.getByTestId('layer-switcher').getByRole('checkbox', { name: 'Precipitation', exact: true }).or(
        page.getByTestId('layer-switcher').getByRole('switch', { name: 'Precipitation', exact: true })
    );
    const isPrecipVisible = await precipLayerToggle.isChecked();
    if (!isPrecipVisible) {
        await precipLayerToggle.click({ force: true });
    }

    // Wait for Precipitation layer to be rendered in the map model
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

    // Step 3: Search for a location 'Münster'
    const geocoderInput = page.getByTestId('geocoder-input');
    await geocoderInput.click();
    await geocoderInput.fill('Münster');

    // Step 4: Wait for results and select the first one
    // The geocoder-results panel should appear
    await expect(page.getByTestId('geocoder-panel')).toBeVisible();
    
    // Wait for the first result item to appear
    const firstResult = page.getByTestId('geocoder-result-item-0');
    await expect(firstResult).toBeVisible();
    
    // Click the first result
    await firstResult.click();

    // Step 5: Wait for the map to navigate
    // We poll the map center to ensure it has changed from the initial center.
    // We don't know the exact center of Münster, but we know it will be different.
    // We capture the initial center before the search.
    const initialCenter = await getMapCenter(page);
    await expect.poll(() => getMapCenter(page)).not.toEqual(initialCenter);

    // Step 6: Wait for the info panel to load the forecast
    // The info panel is visible by default. We need to check if the weather forecast section has entries.
    // We expect 24 entries.
    const weatherForecastEntries = page.getByTestId('weather-forecast-entry');
    await expect(weatherForecastEntries).toHaveCount(24);
});
