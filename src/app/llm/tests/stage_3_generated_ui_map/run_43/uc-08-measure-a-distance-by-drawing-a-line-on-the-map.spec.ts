// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Wait for the map to be ready and interactive
    const mapContainer = page.getByTestId('map-container');
    await expect(mapContainer).toBeVisible();

    // Step 1: The user clicks the 'Measurement' button in the toolbar to open the measurement panel.
    // The measurement toggle button might already be in the active state if the app restored state,
    // but typically it starts inactive. We click it to ensure the panel is open.
    const measurementToggle = page.getByRole('button', { name: 'Measurement' });
    await measurementToggle.click();

    // Verify the measurement panel is visible
    const measurementPanel = page.getByTestId('measurement-panel');
    await expect(measurementPanel).toBeVisible();

    // Step 2: The user clicks several points on the map canvas to draw a line.
    // We need to click on the map canvas. The map container is the target.
    // We'll click three points to create a simple line segment measurement.
    // Point 1
    await mapContainer.click({ position: { x: 100, y: 100 } });
    // Point 2
    await mapContainer.click({ position: { x: 200, y: 200 } });
    // Point 3
    await mapContainer.click({ position: { x: 300, y: 100 } });

    // Step 3: The user double-clicks to finish the measurement.
    await mapContainer.dblclick({ position: { x: 300, y: 100 } });

    // Expected results:
    // - The measurement panel is visible. (Already asserted above, but good to re-check if state changes)
    await expect(measurementPanel).toBeVisible();

    // - The measurement panel displays a length value with a unit.
    // We look for the measurement element inside the panel which should contain the result.
    const measurementElement = page.getByTestId('measurement');
    await expect(measurementElement).toBeVisible();

    // The measurement text should contain a number and a unit (e.g., "m" or "km")
    // We use expect.poll because the measurement value might take a moment to calculate and render after the double-click.
    await expect.poll(async () => {
        const text = await measurementElement.textContent();
        return text;
    }).toMatch(/[\d.]+\s*(m|km|mi|ft)/);
});
