// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({
    page
}) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
    await page.waitForLoadState('domcontentloaded');

    const uvIndexToggle = page.getByRole('checkbox', { name: /UV-Index/i });
    await expect(uvIndexToggle).toBeVisible();
    await expect(uvIndexToggle).not.toBeChecked();

    const mapCanvas = page.locator('canvas').first();
    await expect(mapCanvas).toBeVisible();

    let previousCanvasImage = await mapCanvas.screenshot();
    await expect
        .poll(async () => {
            const currentCanvasImage = await mapCanvas.screenshot();
            const isStable = previousCanvasImage.equals(currentCanvasImage);
            previousCanvasImage = currentCanvasImage;
            return isStable;
        })
        .toBe(true);

    const beforeToggleCanvasImage = await mapCanvas.screenshot();

    const postToggleRequests: string[] = [];
    page.on('request', request => {
        if (['image', 'fetch', 'xhr'].includes(request.resourceType())) {
            postToggleRequests.push(request.url());
        }
    });

    const postToggleResponsePromise = page.waitForResponse(response => {
        const resourceType = response.request().resourceType();
        return ['image', 'fetch', 'xhr'].includes(resourceType) && response.ok();
    });

    await uvIndexToggle.click({ force: true });
    await expect(uvIndexToggle).toBeChecked();

    await expect.poll(() => postToggleRequests.length).toBeGreaterThan(0);

    const postToggleResponse = await postToggleResponsePromise;
    expect(postToggleResponse.ok()).toBeTruthy();

    await expect
        .poll(async () => {
            const afterToggleCanvasImage = await mapCanvas.screenshot();
            return beforeToggleCanvasImage.equals(afterToggleCanvasImage);
        })
        .toBe(false);
});
