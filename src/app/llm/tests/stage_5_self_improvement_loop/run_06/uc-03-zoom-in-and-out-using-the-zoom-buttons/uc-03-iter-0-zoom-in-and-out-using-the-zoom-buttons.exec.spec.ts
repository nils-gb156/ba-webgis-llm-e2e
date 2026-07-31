// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getMapZoomLevel } from '../../../../map-model-helpers';

test('Use Case 3: Zoom in and out using the zoom buttons', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const initialZoom = await expect.poll(() => getMapZoomLevel(page));
    expect(initialZoom).toBeDefined();

    await page.getByRole('button', { name: 'Zoom in map' }).click();

    const zoomedIn = await expect.poll(() => getMapZoomLevel(page));
    expect(zoomedIn).toBeGreaterThan(initialZoom!);

    await page.getByRole('button', { name: 'Zoom out map' }).click();

    const zoomedOut = await expect.poll(() => getMapZoomLevel(page));
    expect(zoomedOut).toBeLessThan(zoomedIn!);
});
