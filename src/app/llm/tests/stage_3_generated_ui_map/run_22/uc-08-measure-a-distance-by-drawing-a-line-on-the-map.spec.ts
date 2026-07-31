// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapZoomLevel, getMapCenter } from '../../../map-model-helpers';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Wait for map to be ready
    await expect.poll(() => getMapZoomLevel(page)).toBeDefined();
    await expect.poll(() => getMapCenter(page)).toBeDefined();

    // Step 1: Activate measurement tool
    const measurementToggle = page.getByTestId('measurement-toggle');
    // Ensure the toggle is in the desired state (active)
    const isCurrentlyPressed = await measurementToggle.getAttribute('aria-pressed');
    if (isCurrentlyPressed !== 'true') {
        await measurementToggle.click();
    }

    // Verify measurement panel is visible
    await expect(page.getByTestId('measurement-panel')).toBeVisible();

    // Step 2: Click several points on the map to draw a line
    // Get initial center to calculate click positions relative to it
    const initialCenter = await getMapCenter(page);
    expect(initialCenter).toBeDefined();
    const center = initialCenter!;

    // Click first point (center of map)
    await page.locator('[data-testid="map-container"]').click({
        position: { x: 0, y: 0 }
    });

    // Click second point (offset from center)
    await page.locator('[data-testid="map-container"]').click({
        position: { x: 100, y: 100 }
    });

    // Click third point (further offset)
    await page.locator('[data-testid="map-container"]').click({
        position: { x: 200, y: 50 }
    });

    // Step 3: Double-click to finish measurement
    await page.locator('[data-testid="map-container"]').dblclick({
        position: { x: 200, y: 50 }
    });

    // Expected results: Measurement panel displays a length value with a unit
    const measurementElement = page.getByTestId('measurement');
    await expect(measurementElement).toBeVisible();
    
    // Wait for the measurement text to appear and contain a number and unit
    await expect.poll(async () => {
        const text = await measurementElement.textContent();
        return text;
    }).toMatch(/\d+\.?\d*\s*(m|km|mi|ft)/);
});
