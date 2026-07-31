// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '../../../failure-snapshot-fixture';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // 1. Activate the measurement tool.
    const measurementToggle = page.getByRole('button', { name: 'Measurement' });
    await measurementToggle.click();

    // 2. Wait for the measurement panel (dialog) to appear.
    const measurementDialog = page.getByRole('dialog', { name: 'Measurement' });
    await expect(measurementDialog).toBeVisible();

    // 3. Click several points on the map canvas to draw a line.
    const mapContainer = page.getByTestId('map-container');

    // Click three points on the map to form a simple line.
    // Coordinates are chosen to be well within the visible map area.
    await mapContainer.click({ position: { x: 400, y: 300 } });
    await page.waitForTimeout(100);
    await mapContainer.click({ position: { x: 500, y: 300 } });
    await page.waitForTimeout(100);
    await mapContainer.click({ position: { x: 600, y: 300 } });

    // 4. Double-click to finish the measurement.
    await mapContainer.dblclick({ position: { x: 600, y: 300 } });

    // 5. Assert that the measurement panel is visible and displays a length value with a unit.
    await expect(measurementDialog).toBeVisible();
    // The dialog content includes the measurement result, e.g. "74.11 km"
    await expect(measurementDialog).toContainText(/[\d.]+\s*(km|m|mi|ft)/);
});
