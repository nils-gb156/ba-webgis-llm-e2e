// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
    await page.waitForLoadState('networkidle');

    const layerSwitcher = page.getByTestId('layer-switcher');
    await expect(layerSwitcher).toBeVisible();

    const mapContainer = page.getByTestId('map-container');
    await expect(mapContainer).toBeVisible();

    const uvIndexCheckbox = layerSwitcher.getByRole('checkbox', { name: 'UV-Index', exact: true });
    await expect(uvIndexCheckbox).not.toBeChecked();

    const beforeMapScreenshot = await mapContainer.screenshot();

    const isUvIndexTileRequest = (url: string): boolean => {
        const normalizedUrl = url.toLowerCase();
        const mentionsUvIndex = /uv(?:-|_|\+|%20)?index|uvi/.test(normalizedUrl);
        const looksLikeTileRequest =
            normalizedUrl.includes('request=getmap') ||
            normalizedUrl.includes('bbox=') ||
            normalizedUrl.includes('tilematrix=') ||
            normalizedUrl.includes('tilecol=') ||
            normalizedUrl.includes('tilerow=') ||
            /\/\d+\/\d+\/\d+(?:\?|$)/.test(normalizedUrl);

        return mentionsUvIndex && looksLikeTileRequest;
    };

    const uvIndexTileRequests: string[] = [];
    page.on('request', request => {
        if (isUvIndexTileRequest(request.url())) {
            uvIndexTileRequests.push(request.url());
        }
    });

    const uvIndexTileResponsePromise = page.waitForResponse(
        response => isUvIndexTileRequest(response.url()) && response.ok()
    );

    await uvIndexCheckbox.click({ force: true });
    await expect(uvIndexCheckbox).toBeChecked();

    const uvIndexTileResponse = await uvIndexTileResponsePromise;
    expect(uvIndexTileResponse.ok()).toBeTruthy();

    await expect.poll(() => uvIndexTileRequests.length).toBeGreaterThan(0);
    await page.waitForLoadState('networkidle');

    await expect.poll(async () => {
        const afterMapScreenshot = await mapContainer.screenshot();
        return afterMapScreenshot.equals(beforeMapScreenshot);
    }).toBe(false);
});
