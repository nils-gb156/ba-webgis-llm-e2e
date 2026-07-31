// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('UC8: Measure a distance by drawing a line on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Step 1: Activate the measurement tool
    const measurementToggle = page.getByTestId('measurement-toggle');
    await measurementToggle.click({ force: true });

    // Verify measurement panel is visible
    const measurementPanel = page.getByTestId('measurement-panel');
    await expect(measurementPanel).toBeVisible();

    // Step 2: Click several points on the map canvas to draw a line
    const mapContainer = page.getByTestId('map-container');

    // Click first point
    await mapContainer.click({ position: { x: 400, y: 300 } });

    // Click second point
    await mapContainer.click({ position: { x: 500, y: 300 } });

    // Click third point
    await mapContainer.click({ position: { x: 600, y: 300 } });

    // Step 3: Double-click to finish the measurement
    await mapContainer.dblclick({ position: { x: 600, y: 300 } });

    // Expected result: Measurement panel displays a length value with a unit
    // The dialog text changes from the instruction to the measurement result (e.g., "123.45 km")
    const measurementResult = page.getByTestId('measurement').getByText(/\d+\.?\d*\s*(m|km|mi|ft)/);
    await expect(measurementResult).toBeVisible();
});
