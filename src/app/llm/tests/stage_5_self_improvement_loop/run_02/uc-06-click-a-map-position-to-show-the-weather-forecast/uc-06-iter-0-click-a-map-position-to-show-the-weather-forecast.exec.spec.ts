// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '../../../failure-snapshot-fixture';
import { getHighlightedCoordinate, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Ensure the info panel is visible.
    // The info panel toggle is pressed (active) in the initial state, so we just
    // wait for the info panel to be visible.
    await expect(page.getByTestId('info-panel')).toBeVisible();

    // Click on a position on the map canvas.
    // We pick a visible area roughly in the center of the map view.
    const mapContainer = page.getByTestId('map-container');
    await mapContainer.click({ position: { x: 500, y: 300 } });

    // Wait for the forecast to load.
    // The forecast section appears in the info panel.
    // We poll for the "Weather Forecast" heading to be visible in the info panel,
    // which indicates the forecast has loaded.
    await expect.poll(() => page.getByTestId('info-panel').getByRole('heading', { name: 'Weather Forecast' }).isVisible()).toBeTruthy();

    // Check that the clicked position is highlighted on the map.
    await expect.poll(() => getHighlightedCoordinate(page)).toBeDefined();

    // The info panel displays a weather forecast section.
    await expect(page.getByTestId('info-panel').getByTestId('weather-forecast-section')).toBeVisible();

    // The forecast contains 24 entries.
    // We poll for the number of forecast entries (likely list items or similar)
    // to be 24.
    await expect.poll(() => page.getByTestId('info-panel').getByTestId('weather-forecast-section').locator('li').count()).toBe(24);
});
