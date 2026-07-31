// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Step 1: Click the 'Measurement' button in the toolbar to open the measurement panel.
    // The toggle button might already be in the active state if the app defaults to it,
    // but typically it's inactive. We click it to ensure the panel is open.
    const measurementToggle = page.getByTestId('measurement-toggle');
    await measurementToggle.click();

    // Verify the measurement panel is visible.
    const measurementPanel = page.getByTestId('measurement-panel');
    await expect(measurementPanel).toBeVisible();

    // Step 2: Click several points on the map canvas to draw a line.
    // We need to click on the map container. The map is a canvas, so we click on the container
    // which contains the canvas. We use specific coordinates to simulate drawing a line.
    const mapContainer = page.getByTestId('map-container');
    
    // Get the bounding box of the map container to calculate click positions relative to it
    const box = await mapContainer.boundingBox();
    if (!box) {
        throw new Error('Map container not found or not visible');
    }

    // Define points to draw a line (relative to the map container)
    const points = [
        { x: box.width * 0.2, y: box.height * 0.2 },
        { x: box.width * 0.5, y: box.height * 0.5 },
        { x: box.width * 0.8, y: box.height * 0.8 }
    ];

    for (const point of points) {
        await mapContainer.click({
            position: { x: point.x, y: point.y }
        });
        // Small delay to ensure the click is registered and the line is drawn
        await page.waitForTimeout(100);
    }

    // Step 3: Double-click to finish the measurement.
    // We double-click on the last point or a nearby point to finish the line.
    await mapContainer.dblclick({
        position: { x: points[points.length - 1].x, y: points[points.length - 1].y }
    });

    // Expected results:
    // The measurement panel displays a length value with a unit.
    const measurementElement = page.getByTestId('measurement');
    await expect(measurementElement).toBeVisible();
    
    // The measurement element should contain text with a number and a unit (e.g., "m", "km", "mi")
    // We use a regex to match a number followed by a unit.
    await expect(measurementElement).toContainText(/\d+(\.\d+)?\s*(mm|cm|m|km|in|ft|mi|yd)/i);
});
