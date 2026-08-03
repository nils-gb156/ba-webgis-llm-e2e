// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getActiveBaseLayerTitle, isLayerRendered } from '../../../../map-model-helpers';

test('UC4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const layerSwitcher = page.getByTestId('layer-switcher');
    await expect(layerSwitcher).toBeVisible();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');

    const uvIndexCheckbox = layerSwitcher.getByRole('checkbox', {
        name: 'UV-Index',
        exact: true
    });

    await expect(uvIndexCheckbox).toBeVisible();
    await expect(uvIndexCheckbox).not.toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'UV-Index')).toBe(false);

    const uvIndexRequestUrls: string[] = [];
    page.on('request', (request) => {
        const url = request.url();
        if (/(uv-?index|uvi)/i.test(url) && ['image', 'xhr', 'fetch'].includes(request.resourceType())) {
            uvIndexRequestUrls.push(url);
        }
    });

    const uvIndexResponsePromise = page.waitForResponse((response) => {
        return response.ok() && /(uv-?index|uvi)/i.test(response.url());
    });

    await uvIndexCheckbox.click({ force: true });

    await expect(uvIndexCheckbox).toBeChecked();
    await expect.poll(() => uvIndexRequestUrls.length).toBeGreaterThan(0);

    const uvIndexResponse = await uvIndexResponsePromise;
    await expect(uvIndexResponse.ok()).toBeTruthy();

    await expect.poll(() => isLayerRendered(page, 'UV-Index')).toBe(true);
});
