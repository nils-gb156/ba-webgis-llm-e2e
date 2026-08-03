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

    await expect.poll(async () => {
        const zoomLevel = await getMapZoomLevel(page);
        return typeof zoomLevel === 'number';
    }).toBe(true);

    const initialZoomLevel = (await getMapZoomLevel(page))!;

    await zoomInButton.click();

    await expect.poll(() => getMapZoomLevel(page)).toBeGreaterThan(initialZoomLevel);

    const zoomLevelAfterZoomIn = (await getMapZoomLevel(page))!;

    await zoomOutButton.click();

    await expect.poll(() => getMapZoomLevel(page)).toBeLessThan(zoomLevelAfterZoomIn);
});
