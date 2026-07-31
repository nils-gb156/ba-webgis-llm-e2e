// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';
import { getMapCenter } from '../../../../map-model-helpers';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Wait for the map to be ready before interacting
    await expect.poll(() => getMapCenter(page)).toBeTruthy();

    // 1. Activate the measurement tool
    const measurementToggle = page.getByRole('button', { name: 'Measurement' });
    await measurementToggle.click();

    // 2. Draw a line by clicking several points on the map
    const mapContainer = page.getByTestId('map-container');

    // Click a first point near the center of the map
    await mapContainer.click({ position: { x: 500, y: 300 } });

    // Click a second point to form a segment
    await mapContainer.click({ position: { x: 600, y: 300 } });

    // Click a third point to add another segment
    await mapContainer.click({ position: { x: 600, y: 400 } });

    // 3. Double-click to finish the measurement
    await mapContainer.dblclick({ position: { x: 600, y: 400 } });

    // 4. Verify the measurement panel is visible and shows a length value
    await expect(page.getByTestId('info-panel')).toBeVisible();

    // The measurement result should be visible in the info panel
    // We look for text that resembles a length measurement (e.g., "X.XX km" or "X.XX m")
    await expect(page.getByTestId('info-panel').getByRole('paragraph')).toHaveText(/.*\d+(\.\d+)?\s*(km|m|mi|ft).*/i);
});
