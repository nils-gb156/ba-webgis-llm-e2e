// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapZoomLevel, isLayerRendered } from '../../../map-model-helpers';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Wait for the map and initial layers to be ready
    await expect(page.getByTestId('map-container')).toBeVisible();
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);

    // Step 1: Activate measurement tool
    // The measurement-toggle button might already be in the correct state, but we click it to ensure it's active.
    // We verify visibility of the panel after clicking.
    const measurementToggle = page.getByTestId('measurement-toggle');
    await measurementToggle.click();

    // Verify measurement panel is visible
    await expect(page.getByTestId('measurement-panel')).toBeVisible();

    // Step 2: Draw a line by clicking points on the map
    const mapContainer = page.getByTestId('map-container');

    // Click first point
    await mapContainer.click({ position: { x: 100, y: 100 } });

    // Click second point to create a segment
    await mapContainer.click({ position: { x: 200, y: 200 } });

    // Click third point to create another segment
    await mapContainer.click({ position: { x: 300, y: 100 } });

    // Step 3: Double-click to finish the measurement
    await mapContainer.dblclick({ position: { x: 300, y: 100 } });

    // Expected results:
    // The measurement panel is visible (already asserted above)
    // The measurement panel displays a length value with a unit.
    // We look for text in the measurement-panel that contains a number followed by a unit like 'm' or 'km'.
    const measurementPanel = page.getByTestId('measurement-panel');
    await expect(measurementPanel).toBeVisible();

    // Use poll to wait for the measurement result to appear in the DOM
    await expect.poll(async () => {
        const text = await measurementPanel.textContent();
        return text;
    }).toMatch(/[\d.]+\s*(m|km|mi|ft)/i);
});
