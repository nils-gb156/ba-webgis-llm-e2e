// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getMapZoomLevel } from '../../../../map-model-helpers';

test('Use Case 3: Zoom in and out using the zoom buttons', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const zoomInButton = page.getByTestId('zoom-in-button');
    const zoomOutButton = page.getByTestId('zoom-out-button');

    await expect(zoomInButton).toBeVisible();
    await expect(zoomOutButton).toBeVisible();

    let initialZoom: number | undefined;
    await expect.poll(async () => {
        initialZoom = await getMapZoomLevel(page);
        return initialZoom;
    }).toEqual(expect.any(Number));

    if (initialZoom === undefined) {
        throw new Error('Initial map zoom level was not available.');
    }

    await zoomInButton.click();

    let zoomAfterZoomIn: number | undefined;
    await expect.poll(async () => {
        zoomAfterZoomIn = await getMapZoomLevel(page);
        return zoomAfterZoomIn;
    }).toBeGreaterThan(initialZoom);

    if (zoomAfterZoomIn === undefined) {
        throw new Error('Map zoom level after zooming in was not available.');
    }

    await zoomOutButton.click();

    await expect.poll(async () => {
        return await getMapZoomLevel(page);
    }).toBeLessThan(zoomAfterZoomIn);
});
