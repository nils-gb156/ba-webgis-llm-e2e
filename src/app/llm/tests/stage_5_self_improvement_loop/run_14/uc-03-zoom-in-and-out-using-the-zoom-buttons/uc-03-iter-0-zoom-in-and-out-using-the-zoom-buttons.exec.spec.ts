// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getMapZoomLevel } from "../../../../map-model-helpers";

test('Use Case 3: Zoom in and out using the zoom buttons', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    await expect(page.getByTestId('map-container')).toBeVisible();
    await expect(page.getByTestId('zoom-in-button')).toBeVisible();
    await expect(page.getByTestId('zoom-out-button')).toBeVisible();

    let initialZoom: number | undefined;
    await expect.poll(async () => {
        initialZoom = await getMapZoomLevel(page);
        return initialZoom;
    }).not.toBeUndefined();

    if (initialZoom === undefined) {
        throw new Error('Initial map zoom level did not become available.');
    }

    await page.getByTestId('zoom-in-button').click();

    let zoomAfterZoomIn: number | undefined;
    await expect.poll(async () => {
        zoomAfterZoomIn = await getMapZoomLevel(page);
        return zoomAfterZoomIn !== undefined ? zoomAfterZoomIn > initialZoom : false;
    }).toBe(true);

    if (zoomAfterZoomIn === undefined) {
        throw new Error('Map zoom level after zooming in did not become available.');
    }

    await page.getByTestId('zoom-out-button').click();

    let zoomAfterZoomOut: number | undefined;
    await expect.poll(async () => {
        zoomAfterZoomOut = await getMapZoomLevel(page);
        return zoomAfterZoomOut !== undefined ? zoomAfterZoomOut < zoomAfterZoomIn : false;
    }).toBe(true);

    if (zoomAfterZoomOut === undefined) {
        throw new Error('Map zoom level after zooming out did not become available.');
    }
});
