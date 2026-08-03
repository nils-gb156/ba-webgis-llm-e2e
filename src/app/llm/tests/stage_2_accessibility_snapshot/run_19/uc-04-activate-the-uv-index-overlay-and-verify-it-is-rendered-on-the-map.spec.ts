// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    await page.waitForLoadState('networkidle');

    const layerSwitcher = page.getByTestId('layer-switcher');
    const mapContainer = page.getByTestId('map-container');
    const uvIndexToggle = layerSwitcher.getByRole('checkbox', { name: 'UV-Index', exact: true });

    await expect(layerSwitcher).toBeVisible();
    await expect(mapContainer).toBeVisible();
    await expect(uvIndexToggle).toBeVisible();
    await expect(uvIndexToggle).not.toBeChecked();

    const beforeScreenshot = await mapContainer.screenshot();

    const mapRequestsAfterToggle: string[] = [];
    page.on('request', (request) => {
        if (
            ['image', 'fetch', 'xhr'].includes(request.resourceType()) &&
            request.url() !== page.url() &&
            !/legend/i.test(request.url())
        ) {
            mapRequestsAfterToggle.push(request.url());
        }
    });

    await uvIndexToggle.click({ force: true });

    await expect(uvIndexToggle).toBeChecked();
    await expect.poll(() => mapRequestsAfterToggle.length).toBeGreaterThan(0);

    await page.waitForLoadState('networkidle');

    await expect.poll(async () => {
        const afterScreenshot = await mapContainer.screenshot();
        return afterScreenshot.equals(beforeScreenshot);
    }).toBe(false);
});
