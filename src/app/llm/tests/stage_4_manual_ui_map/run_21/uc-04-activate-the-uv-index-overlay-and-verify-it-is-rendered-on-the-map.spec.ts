// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle, isLayerRendered } from '../../../map-model-helpers';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
    await page.waitForLoadState('networkidle');

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');

    const layerSwitcher = page.getByTestId('layer-switcher');
    await expect(layerSwitcher).toBeVisible();

    const uvIndexCheckbox = layerSwitcher.getByRole('checkbox', { name: 'UV-Index', exact: true });

    await expect(uvIndexCheckbox).not.toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'UV-Index')).toBe(false);

    const mapRelatedRequests: string[] = [];
    const requestListener = (request: Parameters<typeof page.on<'request'>>[1] extends (arg: infer T) => unknown ? T : never) => {
        if (['image', 'xhr', 'fetch'].includes(request.resourceType())) {
            mapRelatedRequests.push(request.url());
        }
    };

    page.on('request', requestListener);
    try {
        await uvIndexCheckbox.click({ force: true });

        await expect(uvIndexCheckbox).toBeChecked();
        await page.waitForLoadState('networkidle');

        await expect.poll(() => mapRelatedRequests.length).toBeGreaterThan(0);
        await expect.poll(() => isLayerRendered(page, 'UV-Index')).toBe(true);
    } finally {
        page.off('request', requestListener);
    }
});
