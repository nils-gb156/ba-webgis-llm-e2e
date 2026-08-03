// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const mapContainer = page.getByTestId('map-container');
    const layerSwitcher = page.getByTestId('layer-switcher');
    const uvIndexCheckbox = page.getByRole('checkbox', { name: 'UV-Index', exact: true });

    await expect(mapContainer).toBeVisible();
    await expect(layerSwitcher).toBeVisible();
    await expect(uvIndexCheckbox).not.toBeChecked();

    const baselineMapImage = (await mapContainer.screenshot()).toString('base64');

    const uvIndexRequests: string[] = [];
    page.on('request', (request) => {
        if (
            ['image', 'fetch', 'xhr'].includes(request.resourceType()) &&
            /(uv[\W_-]?index|uvi)/i.test(request.url())
        ) {
            uvIndexRequests.push(request.url());
        }
    });

    const uvIndexTileResponsePromise = page.waitForResponse(
        (response) =>
            response.ok() &&
            ['image', 'fetch', 'xhr'].includes(response.request().resourceType()) &&
            /(uv[\W_-]?index|uvi)/i.test(response.url()),
        { timeout: 15000 }
    );

    await uvIndexCheckbox.click({ force: true });
    await expect(uvIndexCheckbox).toBeChecked();

    await uvIndexTileResponsePromise;
    await expect.poll(() => uvIndexRequests.length).toBeGreaterThan(0);

    await expect.poll(async () => (await mapContainer.screenshot()).toString('base64'), {
        timeout: 15000
    }).not.toBe(baselineMapImage);
});
