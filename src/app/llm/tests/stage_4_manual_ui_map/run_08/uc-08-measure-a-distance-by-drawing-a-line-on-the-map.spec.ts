// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Wait for the map to be ready and interactive
    const mapContainer = page.getByTestId('map-container');
    await expect(mapContainer).toBeVisible();

    // Step 1: Click the 'Measurement' button in the toolbar to open the measurement panel.
    const measurementToggle = page.getByTestId('measurement-toggle');
    await measurementToggle.click();

    // Verify the measurement panel is visible
    const measurementPanel = page.getByTestId('measurement-panel');
    await expect(measurementPanel).toBeVisible();

    // Step 2: Click several points on the map canvas to draw a line.
    // We need to click inside the map container. We'll use coordinates relative to the container.
    const box = await mapContainer.boundingBox();
    if (!box) {
        throw new Error('Map container bounding box not found');
    }

    // Calculate some points within the map container to draw a line
    // Point 1: roughly 20% from left, 20% from top
    const point1X = box.x + box.width * 0.2;
    const point1Y = box.y + box.height * 0.2;

    // Point 2: roughly 50% from left, 50% from top
    const point2X = box.x + box.width * 0.5;
    const point2Y = box.y + box.height * 0.5;

    // Point 3: roughly 80% from left, 80% from top
    const point3X = box.x + box.width * 0.8;
    const point3Y = box.y + box.height * 0.8;

    // Click first point
    await page.mouse.click(point1X, point1Y);
    
    // Click second point
    await page.mouse.click(point2X, point2Y);
    
    // Click third point
    await page.mouse.click(point3X, point3Y);

    // Step 3: Double-click to finish the measurement.
    // Double-click on the last point or nearby to finish
    await page.mouse.dblclick(point3X, point3Y);

    // Expected results: The measurement panel displays a length value with a unit.
    const measurementElement = page.getByTestId('measurement');
    await expect(measurementElement).toBeVisible();

    // Wait for the measurement result to appear and contain a length value with a unit
    // The measurement panel might show something like "1234.56 m" or similar
    await expect.poll(async () => {
        const text = await measurementElement.textContent();
        return text;
    }).toMatch(/[\d,.]+\s*(m|km|ft|mi)/);
});
