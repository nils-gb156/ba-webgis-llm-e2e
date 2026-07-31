// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getHighlightedCoordinate } from '../../../../map-model-helpers';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Ensure info panel is visible
    await expect(page.getByTestId('info-panel')).toBeVisible();

    // Click a position on the map canvas
    await page.getByTestId('map-container').click({ position: { x: 300, y: 300 } });

    // Wait for the forecast to load in the info panel
    await expect(page.getByTestId('weather-forecast-section')).toBeVisible();

    // Verify the clicked position is highlighted on the map
    await expect.poll(() => getHighlightedCoordinate(page)).toBeDefined();

    // Verify the forecast contains 24 entries
    const entries = page.getByTestId('weather-forecast-section').getByRole('listitem');
    await expect(entries).toHaveCount(24);
});
