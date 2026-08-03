// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapZoomLevel } from '../../../map-model-helpers';

test('Use Case 3: Zoom in and out using the zoom buttons', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const mapContainer = page.getByTestId('map-container');
    const zoomInButton = page.getByTestId('zoom-in-button');
    const zoomOutButton = page.getByTestId('zoom-out-button');

    await expect(mapContainer).toBeVisible();
    await expect(zoomInButton).toBeVisible();
    await expect(zoomOutButton).toBeVisible();

    const initialZoom = await expect
        .poll(async () => await getMapZoomLevel(page))
        .not.toBeUndefined()
        .then((result) => result);

    await zoomInButton.click();

    const zoomAfterZoomIn = await expect
        .poll(async () => await getMapZoomLevel(page))
        .toBeGreaterThan(initialZoom as number)
        .then((result) => result);

    await zoomOutButton.click();

    await expect.poll(async () => await getMapZoomLevel(page)).toBeLessThan(zoomAfterZoomIn as number);
});
