// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Wait for the map to be fully loaded and ready.
    await expect.poll(() => page.locator('[data-testid="map-container"]').isVisible()).toBe(true);

    // 1. Activate the measurement tool.
    // The measurement toggle is a Chakra checkbox, so we use force: true.
    const measurementToggle = page.getByTestId('measurement-toggle');
    await measurementToggle.click({ force: true });

    // Wait for the measurement panel/dialog to appear.
    const measurementPanel = page.getByTestId('measurement-panel');
    await expect(measurementPanel).toBeVisible();

    // 2. Click several points on the map canvas to draw a line.
    // Use the map-container locator with position offsets from the top-left corner.
    const mapContainer = page.locator('[data-testid="map-container"]');

    // Click point 1
    await mapContainer.click({ position: { x: 400, y: 300 } });

    // Click point 2
    await mapContainer.click({ position: { x: 600, y: 300 } });

    // Click point 3
    await mapContainer.click({ position: { x: 600, y: 500 } });

    // 3. Double-click to finish the measurement.
    await mapContainer.dblclick({ position: { x: 600, y: 500 } });

    // Expected results:
    // - The measurement panel is visible.
    await expect(measurementPanel).toBeVisible();

    // - The measurement panel displays a length value with a unit.
    // The measurement result appears as text inside the measurement panel.
    // We look for a pattern matching a number followed by a unit (e.g., "123.45 km").
    const measurementResult = measurementPanel.getByText(/[\d,.]+\s*(km|m|mi|ft)/);
    await expect(measurementResult).toBeVisible();
});
