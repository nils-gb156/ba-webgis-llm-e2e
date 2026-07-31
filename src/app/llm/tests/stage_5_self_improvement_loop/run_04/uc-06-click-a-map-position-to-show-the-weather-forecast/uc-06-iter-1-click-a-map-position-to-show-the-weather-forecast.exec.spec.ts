// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getHighlightedCoordinate } from '../../../../map-model-helpers';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Ensure the info panel is visible (it is visible by default in the initial state)
    await expect(page.getByTestId('info-panel')).toBeVisible();

    // Click on the map to trigger the weather forecast request
    // The map container is the canvas element. We click near the center of the visible map area.
    const mapContainer = page.getByTestId('map-container');
    const mapBox = await mapContainer.boundingBox();
    if (!mapBox) {
        throw new Error('Map container bounding box not found');
    }

    // Click slightly off-center to avoid hitting any existing markers if possible
    const clickX = mapBox.x + mapBox.width / 2;
    const clickY = mapBox.y + mapBox.height / 2;

    await page.mouse.click(clickX, clickY);

    // Wait for the weather forecast to load in the info panel
    // The entries have data-testid="weather-forecast-entry"
    await expect.poll(async () => {
        const weatherSection = page.getByTestId('weather-forecast-section');
        const isVisible = await weatherSection.isVisible();
        if (!isVisible) return false;
        
        // Check if the section has content (entries)
        const entries = weatherSection.locator('[data-testid="weather-forecast-entry"]');
        const count = await entries.count();
        return count > 0;
    }).toBe(true);

    // Verify the clicked position is highlighted on the map
    await expect.poll(() => getHighlightedCoordinate(page)).toBeTruthy();

    // Verify the info panel displays a weather forecast section
    const weatherSection = page.getByTestId('weather-forecast-section');
    await expect(weatherSection).toBeVisible();

    // Verify the forecast contains 24 entries
    const entries = weatherSection.locator('[data-testid="weather-forecast-entry"]');
    await expect(entries).toHaveCount(24);
});
