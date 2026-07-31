// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getMapZoomLevel } from '../../../../map-model-helpers';

test('Use Case 3: Zoom in and out using the zoom buttons', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Wait for the map to be ready before capturing the initial zoom level.
    await expect.poll(() => getMapZoomLevel(page)).toBeDefined();

    const initialZoom = await getMapZoomLevel(page);
    expect(initialZoom).toBeDefined();

    // 1. Click 'Zoom in' to increase zoom level.
    await page.getByRole('button', { name: 'Zoom in map' }).click();

    // 2. Click 'Zoom out' to decrease zoom level.
    await page.getByRole('button', { name: 'Zoom out map' }).click();

    const finalZoom = await expect.poll(() => getMapZoomLevel(page));

    // After clicking 'Zoom in' then 'Zoom out', the zoom level should be the same as the initial level.
    expect(finalZoom).toBe(initialZoom);
});
