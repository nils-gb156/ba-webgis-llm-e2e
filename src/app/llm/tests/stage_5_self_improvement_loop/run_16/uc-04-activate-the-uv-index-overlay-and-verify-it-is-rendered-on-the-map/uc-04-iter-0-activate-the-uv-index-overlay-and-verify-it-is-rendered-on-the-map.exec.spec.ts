// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getActiveBaseLayerTitle, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');

    const layerSwitcher = page.getByTestId('layer-switcher');
    await expect(layerSwitcher).toBeVisible();

    const uvIndexCheckbox = layerSwitcher.getByRole('checkbox', { name: 'UV-Index', exact: true });

    await expect(uvIndexCheckbox).not.toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'UV-Index')).toBe(false);

    const requestedLayerUrls: string[] = [];
    page.on('request', (request) => {
        const url = request.url();
        if (
            request.resourceType() === 'image' &&
            /(?:uv|uvi|getmap|service=wms|request=getmap)/i.test(url)
        ) {
            requestedLayerUrls.push(url);
        }
    });

    const layerTileResponse = page.waitForResponse((response) => {
        const url = response.url();
        return (
            response.ok() &&
            response.request().resourceType() === 'image' &&
            /(?:uv|uvi|getmap|service=wms|request=getmap)/i.test(url)
        );
    });

    await uvIndexCheckbox.click({ force: true });

    await expect(uvIndexCheckbox).toBeChecked();
    await layerTileResponse;
    await expect.poll(() => requestedLayerUrls.length).toBeGreaterThan(0);
    await expect.poll(() => isLayerRendered(page, 'UV-Index')).toBe(true);
});
