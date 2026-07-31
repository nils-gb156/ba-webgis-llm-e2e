// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // 1. The user clicks the 'Measurement' button in the toolbar to open the measurement panel.
    const measurementToggle = page.getByTestId('measurement-toggle');
    await measurementToggle.click({ force: true });

    // Verify the measurement panel is visible.
    const measurementPanel = page.getByTestId('measurement-panel');
    await expect(measurementPanel).toBeVisible();

    // 2. The user clicks several points on the map canvas to draw a line.
    const mapContainer = page.getByTestId('map-container');

    // Click first point
    await mapContainer.click({ position: { x: 300, y: 300 } });
    // Click second point
    await mapContainer.click({ position: { x: 400, y: 300 } });
    // Click third point
    await mapContainer.click({ position: { x: 500, y: 400 } });

    // 3. The user double-clicks to finish the measurement.
    await mapContainer.dblclick({ position: { x: 600, y: 400 } });

    // Expected results:
    // - The measurement panel is visible.
    await expect(measurementPanel).toBeVisible();

    // - The measurement panel displays a length value with a unit.
    // The measurement result is displayed as text within the measurement panel.
    // We can look for a pattern like "75.24 km" or similar inside the measurement panel.
    // Since the exact text might vary, we can poll for the presence of a number followed by a unit.
    await expect.poll(() => measurementPanel.locator('text=/\\d+\\.?\\d*\\s*(km|m|mi|ft)/').isVisible()).toBe(true);
});
