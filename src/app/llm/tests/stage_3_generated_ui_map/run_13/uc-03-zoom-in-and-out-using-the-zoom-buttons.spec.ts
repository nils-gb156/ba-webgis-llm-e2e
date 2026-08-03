// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapZoomLevel } from '../../../map-model-helpers';

test('Use Case 3: Zoom in and out using the zoom buttons', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const zoomInButton = page.getByTestId('zoom-in-button');
    const zoomOutButton = page.getByTestId('zoom-out-button');

    await expect(zoomInButton).toBeVisible();
    await expect(zoomOutButton).toBeVisible();

    await expect.poll(() => getMapZoomLevel(page)).not.toBeUndefined();
    const initialZoom = await getMapZoomLevel(page);
    if (initialZoom === undefined) {
        throw new Error('Initial map zoom level is not available.');
    }

    await zoomInButton.click();

    await expect.poll(() => getMapZoomLevel(page)).toBeGreaterThan(initialZoom);
    const zoomAfterZoomIn = await getMapZoomLevel(page);
    if (zoomAfterZoomIn === undefined) {
        throw new Error('Map zoom level after zooming in is not available.');
    }

    await zoomOutButton.click();

    await expect.poll(() => getMapZoomLevel(page)).toBeLessThan(zoomAfterZoomIn);
});
