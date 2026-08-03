// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle, isLayerRendered } from '../../../../map-model-helpers';

function isUvIndexLayerRequest(url: string): boolean {
    try {
        const parsed = new URL(url);
        const layerParams = Array.from(parsed.searchParams.entries())
            .filter(([key]) => /^(layers?|query_layers)$/i.test(key))
            .map(([, value]) => value)
            .join(',');

        if (/\b(?:uv[-_ ]?index|uvi)\b/i.test(layerParams)) {
            return true;
        }

        const fullUrl = `${parsed.pathname}${parsed.search}`;
        return /\b(?:uv[-_ ]?index|uvi)\b/i.test(fullUrl) && /\b(?:wms|wmts|getmap|gettile)\b/i.test(fullUrl);
    } catch {
        return /\b(?:uv[-_ ]?index|uvi)\b/i.test(url);
    }
}

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    await expect(page.getByTestId('layer-switcher')).toBeVisible();
    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');

    const uvIndexCheckbox = page.getByRole('checkbox', { name: 'UV-Index', exact: true });

    await expect(uvIndexCheckbox).toBeVisible();
    await expect(uvIndexCheckbox).not.toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'UV-Index')).toBe(false);

    const uvIndexRequests: string[] = [];
    page.on('request', (request) => {
        const url = request.url();
        if (isUvIndexLayerRequest(url)) {
            uvIndexRequests.push(url);
        }
    });

    const uvIndexResponsePromise = page.waitForResponse((response) => {
        return response.ok() && isUvIndexLayerRequest(response.url());
    });

    await uvIndexCheckbox.click({ force: true });

    await expect(uvIndexCheckbox).toBeChecked();
    await expect.poll(() => uvIndexRequests[0]).toMatch(/\b(?:uv[-_ ]?index|uvi)\b/i);
    await uvIndexResponsePromise;
    await expect.poll(() => isLayerRendered(page, 'UV-Index')).toBe(true);
});
