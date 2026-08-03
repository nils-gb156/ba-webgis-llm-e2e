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

    let initialZoomLevel: number | undefined;
    await expect
        .poll(async () => {
            initialZoomLevel = await getMapZoomLevel(page);
            return initialZoomLevel;
        })
        .not.toBeUndefined();

    if (initialZoomLevel === undefined) {
        throw new Error('Initial map zoom level was not available.');
    }

    await zoomInButton.click();

    let zoomedInLevel: number | undefined;
    await expect.poll(async () => {
        zoomedInLevel = await getMapZoomLevel(page);
        return zoomedInLevel;
    }).toBeGreaterThan(initialZoomLevel);

    if (zoomedInLevel === undefined) {
        throw new Error('Zoomed-in map zoom level was not available.');
    }

    await zoomOutButton.click();

    await expect.poll(() => getMapZoomLevel(page)).toBeLessThan(zoomedInLevel);
});
