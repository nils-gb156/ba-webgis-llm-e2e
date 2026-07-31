// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Step 1: The user clicks the 'Measurement' button in the toolbar to open the measurement panel.
    const measurementToggle = page.getByTestId('measurement-toggle');
    await measurementToggle.click();

    // Verify the measurement panel is visible
    await expect(page.getByTestId('measurement-panel')).toBeVisible();

    // Step 2: The user clicks several points on the map canvas to draw a line.
    // We need to click on the map container. We'll pick some arbitrary coordinates
    // relative to the map container's bounding box.
    const mapContainer = page.getByTestId('map-container');
    const box = await mapContainer.boundingBox();

    if (!box) {
        throw new Error('Map container not found or not visible');
    }

    // Click 3 points to draw a line segment
    const point1 = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    const point2 = { x: box.x + box.width / 3, y: box.y + box.height / 3 };
    const point3 = { x: box.x + (box.width * 2) / 3, y: box.y + (box.height * 2) / 3 };

    await page.mouse.click(point1.x, point1.y);
    await page.mouse.click(point2.x, point2.y);
    await page.mouse.click(point3.x, point3.y);

    // Step 3: The user double-clicks to finish the measurement.
    await page.mouse.dblclick(point3.x, point3.y);

    // Expected results:
    // The measurement panel displays a length value with a unit.
    // We poll for the measurement element to contain text that looks like a number followed by a unit.
    const measurementResult = page.getByTestId('measurement');
    
    await expect.poll(async () => {
        const text = await measurementResult.textContent();
        // Check if the text contains a number and a unit (e.g., "123 m", "1.5 km")
        return !!text && /\d+(\.\d+)?\s*(m|km|ft|mi)/i.test(text);
    }).toBeTruthy();
});
