// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapZoomLevel } from '../../../map-model-helpers';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Wait for the map to be fully initialized and interactive
    await expect.poll(() => getMapZoomLevel(page)).toBeDefined();

    // Step 1: The user clicks the 'Measurement' button in the toolbar to open the measurement panel.
    const measurementToggle = page.getByTestId('measurement-toggle');
    await measurementToggle.click();

    // Step 2: The user clicks several points on the map canvas to draw a line.
    // Clicking the map container triggers the measurement drawing interaction.
    const mapContainer = page.getByTestId('map-container');
    await mapContainer.click({ position: { x: 100, y: 100 } });
    await mapContainer.click({ position: { x: 200, y: 200 } });
    await mapContainer.click({ position: { x: 300, y: 100 } });

    // Step 3: The user double-clicks to finish the measurement.
    await mapContainer.dblclick({ position: { x: 300, y: 100 } });

    // Expected results:
    // The measurement panel is visible.
    const measurementPanel = page.getByTestId('measurement-panel');
    await expect(measurementPanel).toBeVisible();

    // The measurement panel displays a length value with a unit.
    const measurementElement = page.getByTestId('measurement');
    await expect(measurementElement).toBeVisible();
    
    // The text content should contain a number and a unit (e.g., "m" or "km")
    await expect.poll(() => measurementElement.textContent()).toMatch(/\d+(\.\d+)?\s*(m|km|mi|ft)/i);
});
