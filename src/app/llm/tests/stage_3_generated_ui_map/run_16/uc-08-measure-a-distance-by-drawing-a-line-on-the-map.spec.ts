// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapZoomLevel } from '../../../map-model-helpers';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Wait for the map to be ready and loaded
    await expect(page.getByTestId('map-container')).toBeVisible();
    await expect.poll(() => getMapZoomLevel(page)).toBeGreaterThan(0);

    // Step 1: Click the 'Measurement' button in the toolbar to open the measurement panel
    const measurementToggle = page.getByTestId('measurement-toggle');
    // Ensure the toggle is in the active state (pressed) to open the panel
    const isCurrentlyPressed = await measurementToggle.getAttribute('aria-pressed');
    if (isCurrentlyPressed !== 'true') {
        await measurementToggle.click();
    }

    // Verify the measurement panel is visible
    await expect(page.getByTestId('measurement-panel')).toBeVisible();

    // Step 2: Click several points on the map canvas to draw a line
    // Clicking on the map container triggers the measurement tool's point addition
    const mapContainer = page.getByTestId('map-container');
    
    // Click first point
    await mapContainer.click({ position: { x: 100, y: 100 } });
    // Click second point
    await mapContainer.click({ position: { x: 200, y: 200 } });
    // Click third point
    await mapContainer.click({ position: { x: 300, y: 100 } });

    // Step 3: Double-click to finish the measurement
    // The measurement tool usually finishes on double-click or a specific "finish" action.
    // Based on standard OpenLayers measurement interactions, double-click finishes the draw.
    await mapContainer.dblclick({ position: { x: 300, y: 100 } });

    // Wait for the measurement result to update in the panel
    // The measurement element likely contains the length value
    const measurementElement = page.getByTestId('measurement');
    
    // Expected result: The measurement panel displays a length value with a unit
    // We assert that the measurement element is visible and contains text that looks like a number and a unit
    await expect(measurementElement).toBeVisible();
    
    // Use expect.poll to wait for the measurement value to settle
    await expect.poll(async () => {
        const text = await measurementElement.textContent();
        return text;
    }).toMatch(/[\d.]+\s*(m|km|mi|ft)/);
});
