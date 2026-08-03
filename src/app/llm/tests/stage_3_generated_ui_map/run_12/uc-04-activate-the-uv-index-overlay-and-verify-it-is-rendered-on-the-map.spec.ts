// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle, isLayerRendered } from '../../../map-model-helpers';

test('UC4: Activate the UV-Index overlay and verify it is rendered on the map', async ({
    page
}) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');

    const layerSwitcher = page.getByTestId('layer-switcher');
    await expect(layerSwitcher).toBeVisible();

    const uvIndexToggle = layerSwitcher.getByRole('checkbox', {
        name: 'UV-Index',
        exact: true
    });

    await expect(uvIndexToggle).toBeVisible();
    await expect(uvIndexToggle).not.toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'UV-Index')).toBe(false);

    await page.waitForLoadState('networkidle');

    const tileRequests: string[] = [];
    page.on('request', (request) => {
        if (request.resourceType() === 'image') {
            tileRequests.push(request.url());
        }
    });

    const tileResponsePromise = page.waitForResponse(
        (response) => response.ok() && response.request().resourceType() === 'image'
    );

    await uvIndexToggle.click({ force: true });

    await expect(uvIndexToggle).toBeChecked();
    await tileResponsePromise;
    await expect.poll(() => tileRequests.length).toBeGreaterThan(0);
    await expect.poll(() => isLayerRendered(page, 'UV-Index')).toBe(true);
});
