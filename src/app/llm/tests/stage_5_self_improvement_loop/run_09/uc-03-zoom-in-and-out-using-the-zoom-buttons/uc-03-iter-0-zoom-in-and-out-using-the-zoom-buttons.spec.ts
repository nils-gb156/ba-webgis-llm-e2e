// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapZoomLevel } from '../../../../map-model-helpers';

test('Use Case 3: Zoom in and out using the zoom buttons', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const zoomInButton = page.getByTestId('zoom-in-button');
    const zoomOutButton = page.getByTestId('zoom-out-button');

    await expect(zoomInButton).toBeVisible();
    await expect(zoomOutButton).toBeVisible();

    let initialZoomLevel: number | undefined;
    await expect
        .poll(async () => {
            const zoom = await getMapZoomLevel(page);
            if (typeof zoom === 'number') {
                initialZoomLevel = zoom;
                return true;
            }
            return false;
        })
        .toBe(true);

    if (initialZoomLevel === undefined) {
        throw new Error('Initial zoom level could not be determined.');
    }

    await zoomInButton.click();

    let zoomLevelAfterZoomIn: number | undefined;
    await expect
        .poll(async () => {
            const zoom = await getMapZoomLevel(page);
            if (typeof zoom === 'number' && zoom > initialZoomLevel) {
                zoomLevelAfterZoomIn = zoom;
                return true;
            }
            return false;
        })
        .toBe(true);

    if (zoomLevelAfterZoomIn === undefined) {
        throw new Error('Zoom level after zooming in could not be determined.');
    }

    await zoomOutButton.click();

    await expect
        .poll(async () => {
            const zoom = await getMapZoomLevel(page);
            return typeof zoom === 'number' && zoom < zoomLevelAfterZoomIn;
        })
        .toBe(true);
});
