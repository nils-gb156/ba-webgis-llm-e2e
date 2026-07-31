// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Wait for the map to be ready
    await expect(page.getByTestId('map-container')).toBeVisible();

    // 1. The user clicks the 'Measurement' button in the toolbar to open the measurement panel.
    const measurementToggle = page.getByRole('button', { name: 'Measurement' });
    await measurementToggle.click();

    // 2. The user clicks several points on the map canvas to draw a line.
    // Click a few points on the map.
    const mapContainer = page.getByTestId('map-container');
    await mapContainer.click({ position: { x: 300, y: 300 } });
    await page.waitForTimeout(500);
    await mapContainer.click({ position: { x: 400, y: 400 } });
    await page.waitForTimeout(500);
    await mapContainer.click({ position: { x: 500, y: 300 } });
    await page.waitForTimeout(500);

    // 3. The user double-clicks to finish the measurement.
    await mapContainer.dblclick({ position: { x: 500, y: 300 } });
    await page.waitForTimeout(1000);

    // Expected results:
    // - The measurement panel is visible.
    const measurementPanel = page.getByTestId('measurement-panel');
    await expect(measurementPanel).toBeVisible();

    // - The measurement panel displays a length value with a unit.
    // The measurement result is displayed in a tooltip on the map.
    const measurementTooltip = page.getByRole('tooltip', { name: /m$/ });
    await expect(measurementTooltip).toBeVisible();
    // Check that the tooltip contains a number and a unit (e.g., "123.45 m")
    await expect(measurementTooltip).toHaveText(/\d+\.?\d*\s*m/);
});
