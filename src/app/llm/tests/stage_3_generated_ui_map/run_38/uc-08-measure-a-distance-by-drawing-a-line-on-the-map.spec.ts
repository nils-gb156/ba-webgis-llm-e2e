// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapZoomLevel } from '../../../map-model-helpers';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Wait for map to be ready and zoom level to be defined
    await expect.poll(() => getMapZoomLevel(page)).toBeDefined();

    // Step 1: Click the 'Measurement' button in the toolbar to open the measurement panel.
    const measurementToggle = page.getByTestId('measurement-toggle');
    // Check current state to avoid toggling if already active
    const isCurrentlyPressed = await measurementToggle.getAttribute('aria-pressed');
    if (isCurrentlyPressed !== 'true') {
        await measurementToggle.click();
    }

    // Verify measurement panel is visible
    await expect(page.getByTestId('measurement-panel')).toBeVisible();

    // Step 2: Click several points on the map canvas to draw a line.
    // We click at different positions to create a line segment.
    const mapContainer = page.getByTestId('map-container');
    
    // Click first point
    await mapContainer.click({ position: { x: 200, y: 200 } });
    
    // Click second point
    await mapContainer.click({ position: { x: 300, y: 300 } });
    
    // Click third point
    await mapContainer.click({ position: { x: 400, y: 200 } });

    // Step 3: Double-click to finish the measurement.
    await mapContainer.dblclick({ position: { x: 400, y: 200 } });

    // Expected results:
    // The measurement panel is visible.
    await expect(page.getByTestId('measurement-panel')).toBeVisible();

    // The measurement panel displays a length value with a unit.
    // We look for text inside the measurement panel that looks like a number followed by a unit (e.g., "1.23 km", "500 m").
    const measurementElement = page.getByTestId('measurement');
    await expect(measurementElement).toBeVisible();
    
    // Use expect.poll to wait for the measurement value to appear and match a pattern
    await expect.poll(async () => {
        const text = await measurementElement.textContent();
        return text;
    }).toMatch(/[\d.]+\s*(km|m|ft|mi)/);
});
