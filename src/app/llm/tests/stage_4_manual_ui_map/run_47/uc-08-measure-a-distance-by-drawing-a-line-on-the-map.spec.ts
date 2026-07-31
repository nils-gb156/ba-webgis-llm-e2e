// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Step 1: Click the measurement button to open the measurement panel.
    const measurementToggle = page.getByTestId('measurement-toggle');
    await measurementToggle.click();

    // Verify the measurement panel is visible.
    await expect(page.getByTestId('measurement-panel')).toBeVisible();

    // Step 2: Click several points on the map canvas to draw a line.
    // We need to click on the map container. The map is a canvas, so we click
    // on specific positions within the map container element.
    const mapContainer = page.getByTestId('map-container');
    const box = await mapContainer.boundingBox();
    if (!box) {
        throw new Error('Map container not found or not visible');
    }

    // Calculate some points on the map to simulate drawing a line.
    // We'll pick 3 points in a rough line pattern.
    const point1 = { x: box.x + box.width * 0.3, y: box.y + box.height * 0.3 };
    const point2 = { x: box.x + box.width * 0.5, y: box.y + box.height * 0.5 };
    const point3 = { x: box.x + box.width * 0.7, y: box.y + box.height * 0.7 };

    // Click the first point.
    await page.mouse.click(point1.x, point1.y);
    // Click the second point.
    await page.mouse.click(point2.x, point2.y);
    // Click the third point.
    await page.mouse.click(point3.x, point3.y);

    // Step 3: Double-click to finish the measurement.
    // Double-click at the last point or a nearby point.
    await page.mouse.dblclick(point3.x, point3.y);

    // Expected results: The measurement panel displays a length value with a unit.
    // The measurement panel contains a 'measurement' element.
    const measurementElement = page.getByTestId('measurement');
    await expect(measurementElement).toBeVisible();

    // Check that the measurement element contains a length value with a unit.
    // The text might look like "12.34 km" or "1234.56 m".
    // We'll use a regex to match a number followed by a unit.
    await expect(measurementElement).toContainText(/[\d.]+\s*(km|m|mi|ft)/i);
});
