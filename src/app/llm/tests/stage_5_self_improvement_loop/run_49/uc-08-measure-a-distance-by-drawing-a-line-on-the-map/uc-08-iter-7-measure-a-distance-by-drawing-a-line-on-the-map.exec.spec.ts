// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Wait for the map to be ready
    await expect(page.getByTestId('map-container')).toBeVisible();

    // Step 1: Activate the measurement tool
    const measurementToggle = page.getByTestId('measurement-toggle');
    await measurementToggle.click();

    // Verify the measurement panel is visible
    const measurementPanel = page.getByRole('dialog', { name: 'Measurement' });
    await expect(measurementPanel).toBeVisible();

    // Step 2: Click several points on the map canvas to draw a line
    const mapContainer = page.getByTestId('map-container');
    // Click points far enough apart to ensure a measurable distance
    await mapContainer.click({ position: { x: 300, y: 300 } });
    await mapContainer.click({ position: { x: 400, y: 400 } });
    await mapContainer.click({ position: { x: 500, y: 350 } });

    // Step 3: Double-click to finish the measurement
    await mapContainer.dblclick({ position: { x: 500, y: 350 } });

    // Expected results: The measurement panel displays a length value with a unit
    await expect.poll(() => measurementPanel.textContent()).toMatch(/\d+(\.\d+)?\s*(m|km|mi|ft)/i, {
        timeout: 10000,
    });
});
