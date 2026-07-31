// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // 1. Click the 'Measurement' button in the toolbar to open the measurement panel.
    const measurementToggle = page.getByTestId('measurement-toggle');
    await measurementToggle.click();

    // Verify the measurement panel is visible.
    await expect(page.getByTestId('measurement-panel')).toBeVisible();

    // 2. Click several points on the map canvas to draw a line.
    // Use pixel offsets relative to the map container viewport so we don't need the
    // map model helpers (which are not needed for this use case).
    const mapContainer = page.getByTestId('map-container');

    // Click first point near center of the visible map area
    await mapContainer.click({ position: { x: 400, y: 300 } });

    // Click second point slightly offset
    await mapContainer.click({ position: { x: 500, y: 250 } });

    // Click third point further offset
    await mapContainer.click({ position: { x: 600, y: 350 } });

    // 3. Double-click to finish the measurement.
    await mapContainer.dblclick({ position: { x: 600, y: 350 } });

    // Expected results:
    // - The measurement panel is visible.
    await expect(page.getByTestId('measurement-panel')).toBeVisible();

    // - The measurement panel displays a length value with a unit.
    // The measurement result usually appears as text like "123.45 km" or "123.45 m".
    // We check if there's any text that matches a number followed by a unit.
    const measurementText = page.getByTestId('measurement-panel').locator('text=/\\d+\\.?\\d*\\s*(km|m|mi|ft)/');
    await expect(measurementText).toBeVisible();
});
