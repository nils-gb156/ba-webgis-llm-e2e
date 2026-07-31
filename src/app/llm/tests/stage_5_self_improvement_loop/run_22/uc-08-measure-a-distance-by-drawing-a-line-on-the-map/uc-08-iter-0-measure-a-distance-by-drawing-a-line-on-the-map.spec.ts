// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';
import { getHighlightedCoordinate } from '../../../../map-model-helpers';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // 1. Activate the measurement tool.
    // The button is in the toolbar and accessible by role.
    const measurementButton = page.getByRole('button', { name: 'Measurement' });
    await measurementButton.click();

    // 2. Wait for the measurement panel to appear.
    await expect(page.getByRole('region')).toContainText('Measurement');

    // 3. Click several points on the map canvas to draw a line.
    const mapContainer = page.getByTestId('map-container');

    // Click three points on the map to form a simple line.
    // Coordinates are chosen to be well within the visible map area.
    await mapContainer.click({ position: { x: 400, y: 300 } });
    await page.waitForTimeout(100);
    await mapContainer.click({ position: { x: 500, y: 300 } });
    await page.waitForTimeout(100);
    await mapContainer.click({ position: { x: 600, y: 300 } });

    // 4. Double-click to finish the measurement.
    await mapContainer.dblclick({ position: { x: 600, y: 300 } });

    // 5. Assert that the measurement panel is visible and displays a length value with a unit.
    // The measurement panel is a region containing text like "Distance: 12.34 km".
    // We use a regex to match the pattern of a number followed by a unit.
    await expect(page.getByTestId('info-panel')).toBeVisible();
    await expect(page.getByTestId('info-panel')).toContainText(/[\d.]+\s*(km|m|mi|ft)/);
});
