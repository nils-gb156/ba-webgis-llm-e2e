// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getHighlightedCoordinate } from '../../../../map-model-helpers';

test('UC8: Measure a distance by drawing a line on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Step 1: Activate the measurement tool
    const measurementToggle = page.getByRole('button', { name: 'Measurement' });
    await measurementToggle.click();

    // Verify measurement panel is visible
    await expect(page.getByTestId('map-controls-panel')).toBeVisible();

    // Step 2: Click several points on the map to draw a line
    const mapContainer = page.getByTestId('map-container');

    // Click first point
    await mapContainer.click({ position: { x: 400, y: 300 } });
    await expect.poll(() => getHighlightedCoordinate(page)).toBeDefined();

    // Click second point
    await mapContainer.click({ position: { x: 500, y: 300 } });
    await expect.poll(() => getHighlightedCoordinate(page)).toBeDefined();

    // Click third point
    await mapContainer.click({ position: { x: 600, y: 300 } });
    await expect.poll(() => getHighlightedCoordinate(page)).toBeDefined();

    // Step 3: Double-click to finish the measurement
    await mapContainer.dblclick({ position: { x: 600, y: 300 } });

    // Expected result: Measurement panel displays a length value with a unit
    const measurementText = page.getByTestId('map-controls-panel').getByText(/m|km|mi|ft/);
    await expect(measurementText).toBeVisible();
});
