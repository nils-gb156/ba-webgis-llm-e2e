// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapZoomLevel } from '../../../../map-model-helpers';

test('Use Case 3: Zoom in and out using the zoom buttons', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Wait for the map to be ready and capture the initial zoom level
    const initialZoom = await expect.poll(() => getMapZoomLevel(page)).toBeDefined();

    // Step 1: Click the 'Zoom in' button to increase the zoom level
    await page.getByRole('button', { name: 'Zoom in map' }).click();

    // Verify zoom level is higher than initial
    const zoomedInLevel = await expect.poll(() => getMapZoomLevel(page)).toBeGreaterThan(initialZoom as number);

    // Step 2: Click the 'Zoom out' button to decrease the zoom level
    await page.getByRole('button', { name: 'Zoom out map' }).click();

    // Verify zoom level is lower than after zooming in
    await expect.poll(() => getMapZoomLevel(page)).toBeLessThan(zoomedInLevel as number);
});
