// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getMapZoomLevel } from '../../../../map-model-helpers';

test('Use Case 3: Zoom in and out using the zoom buttons', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    await expect(page.getByRole('application', { name: 'webgis map' })).toBeVisible();
    await expect(page.getByTestId('map-container')).toBeVisible();

    const zoomInButton = page.getByTestId('zoom-in-button');
    const zoomOutButton = page.getByTestId('zoom-out-button');

    await expect(zoomInButton).toBeVisible();
    await expect(zoomOutButton).toBeVisible();

    let initialZoom: number | undefined;
    await expect
        .poll(async () => {
            initialZoom = await getMapZoomLevel(page);
            return initialZoom;
        })
        .not.toBeUndefined();

    const zoomBefore = initialZoom!;

    await zoomInButton.click();

    await expect
        .poll(async () => {
            const zoom = await getMapZoomLevel(page);
            return typeof zoom === 'number' ? zoom : Number.NEGATIVE_INFINITY;
        })
        .toBeGreaterThan(zoomBefore);

    let zoomAfterIn: number | undefined;
    await expect
        .poll(async () => {
            const zoom = await getMapZoomLevel(page);
            if (typeof zoom === 'number' && zoom > zoomBefore) {
                zoomAfterIn = zoom;
                return zoomAfterIn;
            }
            return undefined;
        })
        .not.toBeUndefined();

    const zoomedInLevel = zoomAfterIn!;

    await zoomOutButton.click();

    await expect
        .poll(async () => {
            const zoom = await getMapZoomLevel(page);
            return typeof zoom === 'number' ? zoom : Number.POSITIVE_INFINITY;
        })
        .toBeLessThan(zoomedInLevel);
});
