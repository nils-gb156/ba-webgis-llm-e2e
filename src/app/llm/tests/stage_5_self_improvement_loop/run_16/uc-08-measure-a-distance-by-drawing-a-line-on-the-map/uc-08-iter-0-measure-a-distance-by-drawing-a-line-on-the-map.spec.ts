// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapCenter, getHighlightedCoordinate } from '../../../../map-model-helpers';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Wait for the map to be fully loaded and ready before interacting.
    // The map model helpers return undefined until the map is initialized.
    await expect.poll(() => getMapCenter(page)).toBeDefined();

    // 1. Activate the measurement tool.
    const measurementToggle = page.getByTestId('measurement-toggle');
    await measurementToggle.click({ force: true });

    // 2. Click several points on the map canvas to draw a line.
    // We use the center of the map as a stable reference point.
    const center = await getMapCenter(page);
    if (!center) {
        throw new Error('Map center is not available.');
    }

    // Click point 1 (center)
    await page.locator('[data-testid="map-container"]').click({ position: { x: 0, y: 0 } });

    // Click point 2 (offset from center)
    await page.locator('[data-testid="map-container"]').click({ position: { x: 100, y: 100 } });

    // Click point 3 (further offset)
    await page.locator('[data-testid="map-container"]').click({ position: { x: 200, y: 50 } });

    // 3. Double-click to finish the measurement.
    await page.locator('[data-testid="map-container"]').dblclick({ position: { x: 200, y: 50 } });

    // Expected results:
    // - The measurement panel is visible.
    // - The measurement panel displays a length value with a unit.
    const infoPanel = page.getByTestId('info-panel');
    await expect(infoPanel).toBeVisible();

    // The measurement result is typically shown in the info panel.
    // We look for text that matches a number followed by a unit (e.g., "123.45 km").
    const measurementResult = infoPanel.getByText(/[\d,.]+\s*(km|m|mi|ft)/);
    await expect(measurementResult).toBeVisible();
});
