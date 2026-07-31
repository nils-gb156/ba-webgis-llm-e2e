// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '../../../failure-snapshot-fixture';
import { getMapZoomLevel } from '../../../../map-model-helpers';

test('9: Print the current map view as a PNG', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Wait for the map to be ready (zoom level becomes defined)
    await expect.poll(() => getMapZoomLevel(page)).toBeDefined();

    // Wait for at least one operational layer to be rendered
    await expect.poll(() => page.evaluate(() => {
        const map = (globalThis as { __openPioneerMap?: { layers?: { getOperationalLayers?: () => { visible?: boolean; title?: string }[] } } }).__openPioneerMap;
        const layers = map?.layers?.getOperationalLayers?.() ?? [];
        return layers.some((l: { visible?: boolean }) => l.visible === true);
    })).toBe(true);

    // Step 4: The user clicks the export/print button.
    // Start waiting for the download *before* triggering the action.
    const [download] = await Promise.all([
        page.waitForEvent('download'),
        page.getByRole('button', { name: 'Print Map' }).click()
    ]);

    // Verify the suggested filename has a PNG extension
    expect(download.suggestedFilename().toLowerCase()).toMatch(/\.png$/);
});
