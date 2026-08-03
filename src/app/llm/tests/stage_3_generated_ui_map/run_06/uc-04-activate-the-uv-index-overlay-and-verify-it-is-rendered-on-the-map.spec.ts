// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle, isLayerRendered } from "../../../map-model-helpers";

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    await expect(page.getByTestId('map-container')).toBeVisible();
    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');

    const layerSwitcher = page.getByTestId('layer-switcher');
    await expect(layerSwitcher).toBeVisible();

    const uvIndexToggle = layerSwitcher.getByRole('checkbox', { name: 'UV-Index', exact: true });
    await expect(uvIndexToggle).toBeVisible();
    await expect(uvIndexToggle).not.toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'UV-Index')).toBe(false);

    const uvIndexRequests: string[] = [];
    let trackUvIndexRequests = false;

    page.on('request', (request) => {
        if (!trackUvIndexRequests) {
            return;
        }

        const url = decodeURIComponent(request.url());
        if (
            ['image', 'xhr', 'fetch'].includes(request.resourceType()) &&
            /(?:uv[\W_%-]*index|uvi)/i.test(url)
        ) {
            uvIndexRequests.push(url);
        }
    });

    trackUvIndexRequests = true;
    await uvIndexToggle.click({ force: true });

    await expect(uvIndexToggle).toBeChecked();
    await expect.poll(() => uvIndexRequests.length > 0).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'UV-Index')).toBe(true);
});
