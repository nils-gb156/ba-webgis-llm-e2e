// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapCenter, getHighlightedCoordinate } from '../../../map-model-helpers';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Wait for the map to be ready and centered before interacting
    await expect.poll(() => getMapCenter(page)).toBeTruthy();

    // 1. Activate the measurement tool
    const measurementToggle = page.getByRole('button', { name: 'Measurement' });
    await measurementToggle.click();

    // Verify the measurement panel is visible
    await expect(page.getByTestId('measurement-panel')).toBeVisible();

    // Get the center of the map to click near it
    const center = await getMapCenter(page);
    if (!center) {
        throw new Error('Map center is not available');
    }

    // Define points for drawing a line near the center
    // Using relative offsets to ensure clicks are on the canvas and distinct
    const points = [
        { x: center[0] - 100, y: center[1] - 100 },
        { x: center[0], y: center[1] },
        { x: center[0] + 100, y: center[1] + 100 }
    ];

    // 2. Click several points to draw a line
    for (const point of points) {
        await page.locator('[data-testid="map-container"]').click({
            position: {
                x: point.x,
                y: point.y
            }
        });
        // Allow a small delay between clicks to ensure the drawing action registers
        await page.waitForTimeout(100);
    }

    // 3. Double-click to finish the measurement
    await page.locator('[data-testid="map-container"]').dblclick({
        position: {
            x: points[points.length - 1].x,
            y: points[points.length - 1].y
        }
    });

    // Wait for the measurement result to appear
    // The measurement element should contain text with a number and a unit (e.g., "1.5 km")
    const measurementElement = page.getByTestId('measurement');
    await expect(measurementElement).toBeVisible();
    
    // Assert that a length value with a unit is displayed
    // We use a regex to match a number followed by a unit string
    await expect.poll(() => measurementElement.textContent()).toMatch(/\d+(\.\d+)?\s+\w+/);
});
