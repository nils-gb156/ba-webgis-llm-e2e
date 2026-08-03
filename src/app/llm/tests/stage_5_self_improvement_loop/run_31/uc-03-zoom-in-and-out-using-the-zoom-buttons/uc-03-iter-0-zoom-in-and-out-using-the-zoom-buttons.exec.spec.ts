// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getMapZoomLevel } from '../../../../map-model-helpers';

test('Use Case 3: Zoom in and out using the zoom buttons', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    await expect(page.getByTestId('map-container')).toBeVisible();
    await expect(page.getByTestId('zoom-in-button')).toBeVisible();
    await expect(page.getByTestId('zoom-out-button')).toBeVisible();

    await expect.poll(() => getMapZoomLevel(page)).not.toBeUndefined();

    const initialZoom = await getMapZoomLevel(page);
    if (initialZoom === undefined) {
        throw new Error('Initial map zoom level was not available after the map became ready.');
    }

    await page.getByTestId('zoom-in-button').click();

    await expect.poll(() => getMapZoomLevel(page)).toBeGreaterThan(initialZoom);

    const zoomAfterZoomIn = await getMapZoomLevel(page);
    if (zoomAfterZoomIn === undefined) {
        throw new Error('Map zoom level after zooming in was not available.');
    }

    await page.getByTestId('zoom-out-button').click();

    await expect.poll(() => getMapZoomLevel(page)).toBeLessThan(zoomAfterZoomIn);
});
