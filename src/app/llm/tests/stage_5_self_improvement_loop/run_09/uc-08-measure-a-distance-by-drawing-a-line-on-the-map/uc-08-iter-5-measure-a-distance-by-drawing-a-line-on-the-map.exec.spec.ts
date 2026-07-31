// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // 1. Activate the measurement tool.
    await page.getByTestId('measurement-toggle').click();

    // Wait for the measurement panel to appear.
    await expect(page.getByTestId('measurement-panel')).toBeVisible();

    // 2. Click several points on the map canvas to draw a line.
    //    Use fixed offsets from the center of the visible map area.
    const mapContainer = page.getByTestId('map-container');
    await mapContainer.click({ position: { x: 300, y: 300 } });
    await mapContainer.click({ position: { x: 500, y: 300 } });
    await mapContainer.click({ position: { x: 500, y: 500 } });

    // 3. Double-click to finish the measurement.
    await mapContainer.dblclick({ position: { x: 500, y: 500 } });

    // Expected results: measurement panel is visible and displays a length value with a unit.
    await expect(page.getByTestId('measurement-panel')).toBeVisible();
    // The measurement result is shown in a tooltip on the map, not inside the panel.
    // After finishing, a tooltip with the total distance appears.
    await expect.poll(() => page.locator('tooltip').allTextContents()).toContain(/[\d.]+\s*(km|m)/);
});
