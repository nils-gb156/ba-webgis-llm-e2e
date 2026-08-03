// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle, isLayerRendered } from '../../../map-model-helpers';

test('UC4 Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect(page.getByTestId('layer-switcher')).toBeVisible();

    const uvIndexToggle = page
        .getByTestId('layer-switcher')
        .getByRole('checkbox', { name: 'UV-Index', exact: true });

    await expect(uvIndexToggle).toBeVisible();
    await expect(uvIndexToggle).not.toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'UV-Index')).toBe(false);

    const uvIndexRequestPattern = /(?:uv(?:-?index|_?index)|\/uvi\/)/i;
    const uvIndexRequestUrls: string[] = [];

    page.on('request', (request) => {
        const url = request.url();
        if (uvIndexRequestPattern.test(url)) {
            uvIndexRequestUrls.push(url);
        }
    });

    await uvIndexToggle.click({ force: true });

    await expect(uvIndexToggle).toBeChecked();
    await expect.poll(() => uvIndexRequestUrls.length).toBeGreaterThan(0);
    await expect.poll(() => isLayerRendered(page, 'UV-Index')).toBe(true);
});
