// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // 1. Activate the measurement tool
    const measurementToggle = page.getByTestId('measurement-toggle');
    await measurementToggle.click({ force: true });

    // Wait for the measurement panel/dialog to appear
    const measurementPanel = page.getByTestId('measurement-panel');
    await expect(measurementPanel).toBeVisible();

    // 2. Click several points on the map canvas to draw a line.
    // Use the map container for clicking, as the map is a canvas.
    const mapContainer = page.getByTestId('map-container');

    // Click point 1
    await mapContainer.click({
        position: { x: 400, y: 300 },
        clickCount: 1,
    });

    // Click point 2 (offset from point 1)
    await mapContainer.click({
        position: { x: 500, y: 400 },
        clickCount: 1,
    });

    // Click point 3 (offset further)
    await mapContainer.click({
        position: { x: 600, y: 350 },
        clickCount: 1,
    });

    // 3. Double-click to finish the measurement
    await mapContainer.dblclick({
        position: { x: 600, y: 350 },
    });

    // Wait for the measurement result to appear.
    // The result appears as a tooltip on the map, e.g., "83.81 km".
    // We can find it by looking for a tooltip element containing a distance pattern.
    const tooltipLocator = page.getByRole('tooltip').filter({ hasText: /\d+(\.\d+)?\s*(km|m|mi|ft)/i });
    await expect(tooltipLocator).toBeVisible({ timeout: 10000 });

    // Additionally, verify the measurement panel is still visible
    await expect(measurementPanel).toBeVisible();
});
