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
    // We need to click on the map container. The map is interactive.
    const mapContainer = page.getByTestId('map-container');

    // Click first point
    await mapContainer.click({ position: { x: 100, y: 100 } });
    
    // Click second point
    await mapContainer.click({ position: { x: 200, y: 200 } });

    // Step 3: The user double-clicks to finish the measurement.
    await mapContainer.dblclick({ position: { x: 300, y: 300 } });

    // Expected results:
    // - The measurement panel is visible.
    await expect(page.getByTestId('measurement-panel')).toBeVisible();

    // - The measurement panel displays a length value with a unit.
    // We poll for the measurement content to appear and contain a number and a unit.
    const measurementContent = page.getByTestId('measurement');
    await expect.poll(() => measurementContent.textContent()).toMatch(/\d+(\.\d+)?\s*(m|km|mi|ft|cm)/);
});
