// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle, isLayerRendered } from "../../../map-model-helpers";

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    await expect(page.getByTestId('map-container')).toBeVisible();
    await expect(page.getByTestId('layer-switcher')).toBeVisible();
    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(() => isLayerRendered(page, 'UV-Index')).toBe(false);

    const layerSwitcher = page.getByTestId('layer-switcher');
    const uvIndexToggle = layerSwitcher.getByRole('checkbox', { name: 'UV-Index', exact: true });

    await expect(uvIndexToggle).toBeVisible();
    await expect(uvIndexToggle).not.toBeChecked();

    const uvIndexRequests: string[] = [];
    page.on('request', (request) => {
        const url = request.url().toLowerCase();
        if (
            url.includes('uv-index') ||
            url.includes('uv_index') ||
            url.includes('uvindex') ||
            url.includes('uvi')
        ) {
            uvIndexRequests.push(request.url());
        }
    });

    await uvIndexToggle.click({ force: true });

    await expect(uvIndexToggle).toBeChecked();
    await expect.poll(() => uvIndexRequests.length).toBeGreaterThan(0);
    await expect.poll(() => isLayerRendered(page, 'UV-Index')).toBe(true);
});
