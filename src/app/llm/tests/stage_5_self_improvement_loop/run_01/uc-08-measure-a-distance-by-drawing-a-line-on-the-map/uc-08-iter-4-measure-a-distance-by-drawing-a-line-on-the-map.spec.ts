// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // 1. Click the 'Measurement' button in the toolbar to open the measurement panel.
    const measurementToggle = page.getByRole('button', { name: 'Measurement' });
    await measurementToggle.click();

    // Verify the measurement panel is visible
    const measurementPanel = page.getByRole('dialog', { name: 'Measurement' });
    await expect(measurementPanel).toBeVisible();

    // 2. The user clicks several points on the map canvas to draw a line.
    // Click the map container at a few distinct positions to draw a line.
    const mapContainer = page.getByTestId('map-container');

    // Click point 1
    await mapContainer.click({ position: { x: 400, y: 300 } });

    // Click point 2
    await mapContainer.click({ position: { x: 600, y: 400 } });

    // Click point 3
    await mapContainer.click({ position: { x: 800, y: 500 } });

    // 3. Double-click to finish the measurement.
    await mapContainer.dblclick({ position: { x: 800, y: 500 } });

    // Expected results:
    // - The measurement panel is visible.
    // - The measurement panel displays a length value with a unit.
    await expect(measurementPanel).toBeVisible();

    // Check for a length value with a unit (e.g., "100 m", "1.5 km")
    // The panel content changes after the measurement is completed
    await expect.poll(() => measurementPanel.textContent()).toMatch(/\d+(\.\d+)?\s*(m|km|mi|ft)/);
});
