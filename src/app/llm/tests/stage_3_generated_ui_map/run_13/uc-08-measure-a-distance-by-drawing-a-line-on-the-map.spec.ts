// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapZoomLevel, isLayerRendered } from '../../../map-model-helpers';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Ensure map is ready
    await expect.poll(() => getMapZoomLevel(page)).toBeDefined();

    // Step 1: Activate measurement tool
    const measurementToggle = page.getByTestId('measurement-toggle');
    const measurementPanel = page.getByTestId('measurement-panel');

    // The panel should be hidden initially. Click the toggle to open it.
    await measurementToggle.click();

    // Step 2 & 3: Draw a line and finish
    const mapContainer = page.getByTestId('map-container');

    // Click first point
    await mapContainer.click({ position: { x: 100, y: 100 } });
    // Click second point
    await mapContainer.click({ position: { x: 200, y: 200 } });
    // Double-click to finish
    await mapContainer.dblclick({ position: { x: 300, y: 300 } });

    // Wait for measurement to settle
    await page.waitForTimeout(1000);

    // Expected results
    // The measurement panel is visible
    await expect(measurementPanel).toBeVisible();

    // The measurement panel displays a length value with a unit
    // We assert that the measurement element contains text that looks like a number followed by a unit
    const measurementElement = page.getByTestId('measurement');
    await expect(measurementElement).toBeVisible();
    
    // Use poll to wait for the text content to update with the measurement result
    await expect.poll(() => measurementElement.textContent()).toMatch(/\d+(\.\d+)?\s*(m|km|ft|mi|km²|ha|m²)/i);
});
