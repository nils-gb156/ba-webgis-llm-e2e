// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle, isLayerRendered } from '../../../map-model-helpers';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    await expect(page.getByTestId('map-container')).toBeVisible();
    await expect(page.getByTestId('layer-switcher')).toBeVisible();
    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');

    const layerSwitcher = page.getByTestId('layer-switcher');
    const uvIndexToggle = layerSwitcher.getByRole('checkbox', { name: 'UV-Index', exact: true });

    await expect(uvIndexToggle).not.toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'UV-Index')).toBe(false);

    const layerRequests: string[] = [];
    page.on('request', (request) => {
        const resourceType = request.resourceType();
        if (resourceType === 'image' || resourceType === 'fetch' || resourceType === 'xhr') {
            layerRequests.push(request.url());
        }
    });

    const layerResponsePromise = page.waitForResponse((response) => {
        const resourceType = response.request().resourceType();
        return response.ok() && (resourceType === 'image' || resourceType === 'fetch' || resourceType === 'xhr');
    });

    await uvIndexToggle.click({ force: true });

    await expect(uvIndexToggle).toBeChecked();
    await layerResponsePromise;
    await expect.poll(() => layerRequests.length).toBeGreaterThan(0);
    await expect.poll(() => isLayerRendered(page, 'UV-Index')).toBe(true);
});
