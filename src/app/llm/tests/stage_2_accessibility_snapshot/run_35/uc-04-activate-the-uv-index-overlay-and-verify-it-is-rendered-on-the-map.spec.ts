// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
    await page.waitForLoadState('networkidle');

    const mapContainer = page.getByTestId('map-container');
    const layerSwitcher = page.getByTestId('layer-switcher');
    const layerSwitcherToggle = page.getByTestId('layer-switcher-toggle');
    const uvIndexCheckbox = page.getByRole('checkbox', { name: 'UV-Index', exact: true });

    await expect(mapContainer).toBeVisible();

    if (!(await layerSwitcher.isVisible())) {
        await layerSwitcherToggle.click();
    }

    await expect(layerSwitcher).toBeVisible();
    await expect(uvIndexCheckbox).toBeVisible();
    await expect(uvIndexCheckbox).not.toBeChecked();

    const beforeMapScreenshot = await mapContainer.screenshot();

    const uvIndexTileRequests: string[] = [];
    const uvIndexTileResponses: string[] = [];

    const isUvIndexTileUrl = (url: string): boolean => {
        let decodedUrl = url;
        try {
            decodedUrl = decodeURIComponent(url);
        } catch {
            decodedUrl = url;
        }

        const normalizedUrl = decodedUrl.toLowerCase();
        return (
            normalizedUrl.includes('uv-index') ||
            normalizedUrl.includes('uv_index') ||
            normalizedUrl.includes('uvindex') ||
            normalizedUrl.includes('uvi')
        );
    };

    page.on('request', (request) => {
        if (request.resourceType() === 'image' && isUvIndexTileUrl(request.url())) {
            uvIndexTileRequests.push(request.url());
        }
    });

    page.on('response', (response) => {
        if (
            response.ok() &&
            response.request().resourceType() === 'image' &&
            isUvIndexTileUrl(response.url())
        ) {
            uvIndexTileResponses.push(response.url());
        }
    });

    await uvIndexCheckbox.click({ force: true });

    await expect(uvIndexCheckbox).toBeChecked();

    await expect.poll(() => uvIndexTileRequests.length).toBeGreaterThan(0);
    await expect.poll(() => uvIndexTileResponses.length).toBeGreaterThan(0);

    await expect.poll(async () => {
        const afterMapScreenshot = await mapContainer.screenshot();
        return afterMapScreenshot.equals(beforeMapScreenshot);
    }).toBe(false);
});
