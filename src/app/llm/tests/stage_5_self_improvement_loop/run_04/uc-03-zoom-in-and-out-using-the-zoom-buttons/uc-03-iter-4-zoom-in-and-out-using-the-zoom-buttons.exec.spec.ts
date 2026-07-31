// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getMapZoomLevel } from '../../../../map-model-helpers';

test('UC3: Zoom in and out using the zoom buttons', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Wait for the map to be ready and get the initial zoom level
    const initialZoom = await expect.poll(() => getMapZoomLevel(page)).toBeDefined();
    expect(initialZoom).toBeDefined();
    const initialZoomValue = initialZoom!;

    // Step 1: Click the 'Zoom in' button
    await page.getByTestId('zoom-in-button').click();

    // Verify the zoom level increased
    await expect.poll(() => getMapZoomLevel(page)).toBeGreaterThan(initialZoomValue);

    // Step 2: Click the 'Zoom out' button
    await page.getByTestId('zoom-out-button').click();

    // Verify the zoom level decreased (should be lower than after zooming in)
    await expect.poll(() => getMapZoomLevel(page)).toBeLessThan(initialZoomValue);
});
