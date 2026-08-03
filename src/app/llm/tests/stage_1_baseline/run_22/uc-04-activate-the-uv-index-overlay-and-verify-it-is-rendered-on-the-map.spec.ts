// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
    await page.waitForLoadState('domcontentloaded');

    const uvIndexToggle = page.getByRole('checkbox', { name: 'UV-Index', exact: true });
    const mapViewport = page.locator('.ol-viewport').first();

    await expect(uvIndexToggle).toBeVisible();
    await expect(mapViewport).toBeVisible();
    await expect(uvIndexToggle).not.toBeChecked();

    const initialMapImage = await mapViewport.screenshot();

    const uvIndexRequests: string[] = [];
    page.on('request', request => {
        const url = request.url();
        const decodedUrl = decodeURIComponent(url);
        if (/uv[-_ ]?index/i.test(url) || /uv[-_ ]?index/i.test(decodedUrl)) {
            uvIndexRequests.push(url);
        }
    });

    const uvIndexResponsePromise = page.waitForResponse(response => {
        const url = response.url();
        const decodedUrl = decodeURIComponent(url);
        return response.ok() && (/uv[-_ ]?index/i.test(url) || /uv[-_ ]?index/i.test(decodedUrl));
    });

    await uvIndexToggle.click({ force: true });

    await expect(uvIndexToggle).toBeChecked();

    await uvIndexResponsePromise;

    await expect.poll(() => uvIndexRequests.length).toBeGreaterThan(0);

    await expect.poll(async () => {
        const currentMapImage = await mapViewport.screenshot();
        return currentMapImage.equals(initialMapImage);
    }).toBe(false);
});
