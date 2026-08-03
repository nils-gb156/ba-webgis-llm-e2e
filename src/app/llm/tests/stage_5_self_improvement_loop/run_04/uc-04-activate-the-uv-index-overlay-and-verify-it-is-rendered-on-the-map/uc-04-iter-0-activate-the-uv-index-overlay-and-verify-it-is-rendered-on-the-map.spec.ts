// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({
    page
}) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    await expect(page.getByRole('application', { name: 'webgis map' })).toBeVisible();
    await expect(page.getByTestId('layer-switcher')).toBeVisible();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');

    const uvIndexCheckbox = page.getByRole('checkbox', { name: 'UV-Index', exact: true });
    await expect(uvIndexCheckbox).not.toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'UV-Index')).toBe(false);

    const uvLayerRequestPattern = /(?:uvi|uv[\W_]*index)/i;
    const uvLayerRequests: string[] = [];

    page.on('request', (request) => {
        const resourceType = request.resourceType();
        if (!['image', 'xhr', 'fetch'].includes(resourceType)) {
            return;
        }

        const url = request.url();
        if (uvLayerRequestPattern.test(url)) {
            uvLayerRequests.push(url);
        }
    });

    const uvLayerResponsePromise = page.waitForResponse((response) => {
        const resourceType = response.request().resourceType();
        return (
            response.ok() &&
            ['image', 'xhr', 'fetch'].includes(resourceType) &&
            uvLayerRequestPattern.test(response.url())
        );
    });

    await uvIndexCheckbox.click({ force: true });

    await expect(uvIndexCheckbox).toBeChecked();
    await expect.poll(() => uvLayerRequests.length).toBeGreaterThan(0);
    await uvLayerResponsePromise;
    await expect.poll(() => isLayerRendered(page, 'UV-Index')).toBe(true);
});
