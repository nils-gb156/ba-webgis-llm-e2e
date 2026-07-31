// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('8: Measure a distance by drawing a line on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Step 1: Click the 'Measurement' button in the toolbar to open the measurement panel.
    const measurementToggle = page.getByTestId('measurement-toggle');
    await measurementToggle.click();

    // Verify the measurement panel is visible
    const measurementPanel = page.getByRole('dialog', { name: 'Measurement' });
    await expect(measurementPanel).toBeVisible();

    // Step 2: Click several points on the map canvas to draw a line.
    const mapContainer = page.getByTestId('map-container');

    // Click a first point
    await mapContainer.click({ position: { x: 300, y: 300 } });
    // Click a second point
    await mapContainer.click({ position: { x: 400, y: 400 } });
    // Click a third point
    await mapContainer.click({ position: { x: 500, y: 300 } });

    // Step 3: Double-click to finish the measurement.
    await mapContainer.dblclick({ position: { x: 500, y: 300 } });

    // Expected results:
    // - The measurement panel is visible.
    await expect(measurementPanel).toBeVisible();

    // - The measurement panel displays a length value with a unit.
    // The panel contains text like "0 m" or "123.45 km" after measurement.
    // Use expect.poll to wait for the async measurement result to settle.
    await expect.poll(() => measurementPanel.textContent()).toMatch(/\d+(\.\d+)?\s*(km|m|mi|ft)/i);
});
