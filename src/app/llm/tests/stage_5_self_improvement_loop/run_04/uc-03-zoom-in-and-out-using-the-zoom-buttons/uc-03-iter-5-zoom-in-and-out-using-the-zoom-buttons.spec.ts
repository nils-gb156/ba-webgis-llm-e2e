// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapZoomLevel } from '../../../../map-model-helpers';

test('UC3: Zoom in and out using the zoom buttons', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Wait for the map to be ready and get the initial zoom level
    const initialZoomValue = await expect.poll(() => getMapZoomLevel(page)).toBeDefined();

    // Step 1: Click the 'Zoom in' button
    await page.getByTestId('zoom-in-button').click();

    // Verify the zoom level increased
    const zoomedIn = await expect.poll(() => getMapZoomLevel(page)).toBeGreaterThan(initialZoomValue);

    // Step 2: Click the 'Zoom out' button
    await page.getByTestId('zoom-out-button').click();

    // Verify the zoom level decreased (should be lower than after zooming in)
    await expect.poll(() => getMapZoomLevel(page)).toBeLessThan(zoomedIn);
});
