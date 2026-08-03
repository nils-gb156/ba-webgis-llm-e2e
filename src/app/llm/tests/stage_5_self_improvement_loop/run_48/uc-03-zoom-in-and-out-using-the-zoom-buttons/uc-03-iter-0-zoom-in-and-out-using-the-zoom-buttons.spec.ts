// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapZoomLevel } from '../../../../map-model-helpers';

test('UC3: Zoom in and out using the zoom buttons', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const zoomInButton = page.getByTestId('zoom-in-button');
    const zoomOutButton = page.getByTestId('zoom-out-button');

    await expect(zoomInButton).toBeVisible();
    await expect(zoomOutButton).toBeVisible();

    const getStableZoomLevel = async (): Promise<number> => {
        await expect.poll(() => getMapZoomLevel(page)).not.toBeUndefined();
        const zoom = await getMapZoomLevel(page);
        if (zoom === undefined) {
            throw new Error('Map zoom level is undefined.');
        }
        return zoom;
    };

    const initialZoom = await getStableZoomLevel();

    await zoomInButton.click();

    await expect
        .poll(async () => {
            const zoom = await getMapZoomLevel(page);
            return zoom ?? Number.NEGATIVE_INFINITY;
        })
        .toBeGreaterThan(initialZoom);

    const zoomAfterZoomIn = await getStableZoomLevel();

    await zoomOutButton.click();

    await expect
        .poll(async () => {
            const zoom = await getMapZoomLevel(page);
            return zoom ?? Number.POSITIVE_INFINITY;
        })
        .toBeLessThan(zoomAfterZoomIn);
});
