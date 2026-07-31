// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getHighlightedCoordinate, isLayerRendered } from '../../../../map-model-helpers';

test("Use Case 6: Click a map position to show the weather forecast", async ({ page }) => {
    await page.goto('/ba-webgis-llm-e2e/');

    // Ensure the info panel is visible.
    // The toggle is a button with `aria-pressed="true"`, not a checkbox.
    const infoPanelToggle = page.getByRole('button', { name: 'Info Panel Switcher' });
    await expect(infoPanelToggle).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByTestId('info-panel')).toBeVisible();

    // Click the map to trigger a forecast request.
    // Use a position near the center of the visible map area.
    const mapContainer = page.getByTestId('map-container');
    await mapContainer.click({ position: { x: 600, y: 300 } });

    // Wait for the forecast section to appear in the info panel.
    await expect(page.getByTestId('weather-forecast-section')).toBeVisible();

    // Assert that the clicked position is highlighted on the map.
    await expect.poll(() => getHighlightedCoordinate(page)).toBeDefined();

    // Assert that the forecast contains 24 entries.
    // The forecast section renders a list of entries; count them.
    const forecastEntries = page.getByTestId('weather-forecast-section').locator('li');
    await expect(forecastEntries).toHaveCount(24);
});
