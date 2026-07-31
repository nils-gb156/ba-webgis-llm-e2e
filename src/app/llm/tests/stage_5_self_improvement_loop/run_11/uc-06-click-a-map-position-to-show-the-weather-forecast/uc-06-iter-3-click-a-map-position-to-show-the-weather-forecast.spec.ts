// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';
import { getHighlightedCoordinate } from '../../../../map-model-helpers';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Verify the info panel is visible and shows the initial state
    await expect(page.getByTestId('info-panel')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Weather Forecast' })).toBeVisible();
    await expect(page.getByText('Click on the map to load a forecast.')).toBeVisible();

    // Ensure the info panel toggle is in the pressed (open) state
    const infoToggle = page.getByRole('button', { name: 'Info Panel Switcher' });
    const infoTogglePressed = await infoToggle.getAttribute('aria-pressed');
    if (infoTogglePressed !== 'true') {
        await infoToggle.click();
    }

    // Click on the map canvas to trigger the forecast fetch
    const mapContainer = page.getByTestId('map-container');
    await mapContainer.click({ position: { x: 300, y: 300 } });

    // Wait for the clicked position to be highlighted on the map
    await expect.poll(() => getHighlightedCoordinate(page)).toBeDefined();

    // Wait for the forecast to load by checking the info panel content changes
    await expect.poll(() => page.getByTestId('weather-forecast-section').isVisible()).toBeTruthy();

    // Verify the info panel displays a weather forecast section
    await expect(page.getByRole('heading', { name: 'Weather Forecast' })).toBeVisible();

    // The forecast contains 24 entries (e.g., hourly data)
    const forecastSection = page.getByTestId('weather-forecast-section');
    // The forecast section contains 24 hourly entries, each wrapped in a div.
    const forecastEntries = forecastSection.locator('div');
    await expect.poll(async () => {
        const count = await forecastEntries.count();
        return count;
    }).toBe(24);
});
