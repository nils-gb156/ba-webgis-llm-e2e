// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Step 1: Activate the measurement tool
    // The toggle button is already pressed (active) in the initial state, so clicking it
    // would close the panel. We assert it is visible first, and only click if not pressed.
    const measurementToggle = page.getByRole('button', { name: 'Measurement' });
    const isPressed = await measurementToggle.getAttribute('aria-pressed');
    if (isPressed !== 'true') {
        await measurementToggle.click({ force: true });
    }

    // Verify the measurement panel (dialog) is visible
    await expect(page.getByRole('dialog', { name: 'Measurement' })).toBeVisible();

    // Step 2: Click several points on the map canvas to draw a line
    // We click at offsets from the center to ensure we are on the map canvas
    // and not on any UI elements.
    const mapContainer = page.getByTestId('map-container');
    await mapContainer.click({ position: { x: -100, y: -50 } });
    await mapContainer.click({ position: { x: 100, y: -50 } });
    await mapContainer.click({ position: { x: 100, y: 50 } });

    // Step 3: Double-click to finish the measurement
    await mapContainer.dblclick({ position: { x: 100, y: 50 } });

    // Expected results
    // The measurement panel is visible (already asserted)
    // The measurement panel displays a length value with a unit.
    await expect.poll(() => page.getByRole('dialog', { name: 'Measurement' }).textContent()).toMatch(/\d+(\.\d+)?\s*(km|m)/);
});
