// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapCenter, getMapZoomLevel } from '../../../map-model-helpers';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // 1. The user clicks the 'Measurement' button in the toolbar to open the measurement panel.
    const measurementToggle = page.getByTestId('measurement-toggle');
    
    // Check current state of the toggle to ensure we open it, not close it
    const isMeasurementPanelOpen = await page.getByTestId('measurement-panel').isVisible();
    const isTogglePressed = await measurementToggle.getAttribute('aria-pressed');
    
    // If the panel is not visible but toggle says it is pressed (or vice versa), force click to ensure correct state
    // Generally, we want the panel open. If it's already open, we don't click.
    if (!isMeasurementPanelOpen && isTogglePressed !== 'true') {
        await measurementToggle.click({ force: true });
    } else if (!isMeasurementPanelOpen && isTogglePressed === 'true') {
        // Toggle says pressed but panel not visible? Force click to open.
        await measurementToggle.click({ force: true });
    } else if (isMeasurementPanelOpen && isTogglePressed !== 'true') {
        // Panel visible but toggle not pressed? This is an inconsistency, but panel is visible which is what we need.
        // We assume the state is correct enough to proceed.
    }
    // If panel is visible and toggle is pressed, do nothing.

    // Wait for the measurement panel to be visible
    await expect(page.getByTestId('measurement-panel')).toBeVisible();

    // 2. The user clicks several points on the map canvas to draw a line.
    const mapContainer = page.getByTestId('map-container');
    
    // Get initial center to click around
    const initialCenter = await getMapCenter(page);
    if (!initialCenter) {
        throw new Error('Map is not ready');
    }

    // Click a few points to draw a line. 
    // We click slightly offset from the center to ensure distinct points.
    // Coordinates are in EPSG:3857. We'll click relative to the center.
    const click1 = { x: initialCenter[0] - 100, y: initialCenter[1] - 100 };
    const click2 = { x: initialCenter[0] + 100, y: initialCenter[1] - 100 };
    const click3 = { x: initialCenter[0] + 100, y: initialCenter[1] + 100 };

    // Click first point
    await mapContainer.click({ position: { x: 100, y: 100 }, force: true });
    // Click second point
    await mapContainer.click({ position: { x: 200, y: 100 }, force: true });
    // Click third point
    await mapContainer.click({ position: { x: 200, y: 200 }, force: true });

    // 3. The user double-clicks to finish the measurement.
    // Double click on the map to finish
    await mapContainer.dblclick({ position: { x: 200, y: 200 }, force: true });

    // Wait a bit for the measurement result to render
    await page.waitForTimeout(500);

    // Expected results:
    // - The measurement panel is visible.
    await expect(page.getByTestId('measurement-panel')).toBeVisible();

    // - The measurement panel displays a length value with a unit.
    // The measurement element should contain text that looks like a number followed by a unit (e.g., "1.23 km")
    const measurementElement = page.getByTestId('measurement');
    
    // Use expect.poll to wait for the measurement value to appear
    await expect.poll(async () => {
        const text = await measurementElement.innerText();
        return text;
    }).toMatch(/\d+\.?\d*\s*(km|m|cm|mm|mi|ft)/);
});
