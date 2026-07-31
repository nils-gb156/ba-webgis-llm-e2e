// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Step 1: Activate the measurement tool
    // The accessibility tree shows the button is "Measurement" and the toggle is not yet pressed.
    await page.getByRole('button', { name: 'Measurement' }).click();

    // Verify the measurement panel (dialog) is visible
    await expect(page.getByRole('dialog', { name: 'Measurement' })).toBeVisible();

    // Step 2: Click several points on the map canvas to draw a line
    const mapContainer = page.getByTestId('map-container');
    await mapContainer.click({ position: { x: 300, y: 300 } });
    await mapContainer.click({ position: { x: 400, y: 400 } });
    await mapContainer.click({ position: { x: 500, y: 350 } });

    // Step 3: Double-click to finish the measurement
    await mapContainer.dblclick({ position: { x: 500, y: 350 } });

    // Expected results:
    // The measurement panel is visible (already asserted above)
    // The measurement panel displays a length value with a unit
    // The dialog contains a group with the measurement result (e.g. "123 m")
    await expect.poll(() =>
        page
            .getByRole('group')
            .getByText(/\d+(\.\d+)?\s*m/i)
            .first()
            .textContent()
    ).toMatch(/\d+(\.\d+)?\s*m/i);
});
