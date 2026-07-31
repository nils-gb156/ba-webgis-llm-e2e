// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Wait for the map to be ready before interacting
    await expect(page.getByTestId('map-container')).toBeVisible();

    // Step 1: Click the 'Measurement' button in the toolbar to open the measurement panel.
    // The measurement-toggle is a toggle button. We assert the panel becomes visible.
    await page.getByTestId('measurement-toggle').click();

    // Expected result: The measurement panel is visible.
    await expect(page.getByTestId('measurement-panel')).toBeVisible();

    // Step 2: Click several points on the map canvas to draw a line.
    // We need to click on the map container at different positions.
    // The map container is a canvas, so we click on the element itself with position offsets.
    const mapContainer = page.getByTestId('map-container');
    
    // Click first point (approximate center)
    await mapContainer.click({ position: { x: 300, y: 300 } });
    
    // Click second point (offset to create a line)
    await mapContainer.click({ position: { x: 400, y: 300 } });
    
    // Click third point (offset further)
    await mapContainer.click({ position: { x: 450, y: 200 } });

    // Step 3: Double-click to finish the measurement.
    await mapContainer.dblclick({ position: { x: 450, y: 200 } });

    // Expected results: The measurement panel displays a length value with a unit.
    // We poll for the measurement element to contain text that looks like a number and a unit (e.g., "1.2 km", "500 m").
    await expect.poll(() => page.getByTestId('measurement').textContent()).toMatch(/\d+(\.\d+)?\s+(m|km|mi|ft)/i);
});
