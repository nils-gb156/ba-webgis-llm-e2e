// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Wait for the map to be ready and interactive
    await expect(page.getByTestId('map-container')).toBeVisible();

    // Step 1: Activate the measurement tool
    const measurementToggle = page.getByTestId('measurement-toggle');
    // Ensure the panel is closed before clicking if it's already open (though it shouldn't be by default)
    const measurementPanel = page.getByTestId('measurement-panel');
    
    // Click the toggle to open the measurement panel
    await measurementToggle.click();
    
    // Verify the measurement panel is visible
    await expect(measurementPanel).toBeVisible();

    // Step 2: Click several points on the map canvas to draw a line
    const mapContainer = page.getByTestId('map-container');
    
    // Get the bounding box of the map to calculate click positions
    const box = await mapContainer.boundingBox();
    if (!box) {
        throw new Error('Map container not found or has no bounding box');
    }

    // Calculate center and some offset points to ensure we are clicking on the map
    const centerX = box.x + box.width / 2;
    const centerY = box.y + box.height / 2;
    
    // Define points for a simple line (e.g., center, slightly up-right, further up-right)
    const point1 = { x: centerX, y: centerY };
    const point2 = { x: centerX + 50, y: centerY - 50 };
    const point3 = { x: centerX + 100, y: centerY - 100 };

    // Click the first point
    await mapContainer.click({ position: point1 });
    // Small delay to ensure the click is registered
    await page.waitForTimeout(100);

    // Click the second point
    await mapContainer.click({ position: point2 });
    await page.waitForTimeout(100);

    // Click the third point
    await mapContainer.click({ position: point3 });
    await page.waitForTimeout(100);

    // Step 3: Double-click to finish the measurement
    await mapContainer.dblclick({ position: point3 });

    // Expected results:
    // The measurement panel is visible (already asserted)
    // The measurement panel displays a length value with a unit
    
    // Wait for the measurement result to appear in the panel
    // The measurement element likely contains the text result
    const measurementElement = page.getByTestId('measurement');
    
    // Use poll to wait for the measurement text to appear and contain a number and unit
    await expect.poll(async () => {
        const text = await measurementElement.innerText();
        return text;
    }).toMatch(/[\d.]+\s*(m|km|mi|ft)/i);
});
