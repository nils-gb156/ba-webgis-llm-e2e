// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getHighlightedCoordinate } from '../../../../map-model-helpers';

test('UC6: Click a map position to show the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Step 1: Click a position on the map canvas.
    // The info panel is already visible, so we can click the map directly.
    await page.getByTestId('map-container').click({
        position: { x: 600, y: 300 },
    });

    // Step 2: Wait for the info panel to load the forecast.
    // The forecast section should appear and contain 24 entries.
    await expect.poll(() =>
        page.getByTestId('weather-forecast-section').locator('[data-testid="weather-forecast-entry"]').count()
    ).toBe(24);

    // Expected result: The clicked position is highlighted on the map.
    await expect.poll(() => getHighlightedCoordinate(page)).toBeDefined();

    // Expected result: The info panel displays a weather forecast section.
    await expect(page.getByTestId('weather-forecast-section')).toBeVisible();
});
