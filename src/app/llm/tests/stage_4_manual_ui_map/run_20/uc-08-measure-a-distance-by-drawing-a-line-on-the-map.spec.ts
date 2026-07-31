// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Step 1: Click the 'Measurement' button in the toolbar to open the measurement panel.
    const measurementToggle = page.getByTestId('measurement-toggle');
    await measurementToggle.click();

    // Verify the measurement panel is visible.
    await expect(page.getByTestId('measurement-panel')).toBeVisible();

    // Step 2: Click several points on the map canvas to draw a line.
    const mapContainer = page.getByTestId('map-container');
    
    // Click three points to draw a line (first 3 clicks)
    await mapContainer.click({ position: { x: 100, y: 100 } });
    await mapContainer.click({ position: { x: 200, y: 100 } });
    await mapContainer.click({ position: { x: 200, y: 200 } });

    // Step 3: Double-click to finish the measurement.
    await mapContainer.dblclick({ position: { x: 200, y: 200 } });

    // Expected results: The measurement panel displays a length value with a unit.
    const measurementElement = page.getByTestId('measurement');
    await expect(measurementElement).toBeVisible();
    
    // The measurement element should contain text that looks like a length value with a unit (e.g., "123.45 m" or "1.23 km")
    // We use a regex to match a number followed by optional decimals and a unit.
    await expect(measurementElement).toContainText(/^[0-9]+(\.[0-9]+)?\s*(mm|cm|m|km|in|ft|mi|yd)$/i);
});
