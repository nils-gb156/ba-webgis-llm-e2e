// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle, isLayerRendered } from "../../../../map-model-helpers";

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const layerSwitcher = page.getByTestId('layer-switcher');
    await expect(layerSwitcher).toBeVisible();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');

    const uvIndexCheckbox = layerSwitcher.getByRole('checkbox', { name: 'UV-Index', exact: true });
    await expect(uvIndexCheckbox).toBeVisible();
    await expect(uvIndexCheckbox).not.toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'UV-Index')).toBe(false);

    const uvIndexLayerRequests: string[] = [];
    page.on('request', (request) => {
        const url = request.url().toLowerCase();
        const resourceType = request.resourceType();
        const isUvIndexRequest =
            url.includes('uv-index') ||
            url.includes('uvindex') ||
            url.includes('uvi');

        if (isUvIndexRequest && ['image', 'xhr', 'fetch'].includes(resourceType)) {
            uvIndexLayerRequests.push(request.url());
        }
    });

    await uvIndexCheckbox.click({ force: true });

    await expect(uvIndexCheckbox).toBeChecked();
    await expect.poll(() => uvIndexLayerRequests.length).toBeGreaterThan(0);
    await expect.poll(() => isLayerRendered(page, 'UV-Index')).toBe(true);
});
