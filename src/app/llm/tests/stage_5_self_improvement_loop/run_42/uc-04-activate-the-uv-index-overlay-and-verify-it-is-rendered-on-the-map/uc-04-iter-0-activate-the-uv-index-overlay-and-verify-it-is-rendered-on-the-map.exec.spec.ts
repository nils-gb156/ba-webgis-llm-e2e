// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getActiveBaseLayerTitle, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const layerSwitcher = page.getByTestId('layer-switcher');
    await expect(layerSwitcher).toBeVisible();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');

    const uvIndexCheckbox = page.getByRole('checkbox', { name: 'UV-Index', exact: true });

    await expect(uvIndexCheckbox).not.toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'UV-Index')).toBe(false);

    const isUvIndexRequest = (url: string) => {
        const decodedUrl = decodeURIComponent(url).toLowerCase();
        return (
            decodedUrl.includes('uv-index') ||
            decodedUrl.includes('uv_index') ||
            decodedUrl.includes('uvindex') ||
            decodedUrl.includes('uvi')
        );
    };

    let uvIndexRequestUrl: string | undefined;
    page.on('request', (request) => {
        const url = request.url();
        if (isUvIndexRequest(url)) {
            uvIndexRequestUrl = url;
        }
    });

    const uvIndexResponsePromise = page.waitForResponse((response) => {
        return response.ok() && isUvIndexRequest(response.url());
    });

    await uvIndexCheckbox.click({ force: true });

    await expect(uvIndexCheckbox).toBeChecked();
    await uvIndexResponsePromise;
    await expect.poll(() => uvIndexRequestUrl).toMatch(/uv(?:-|_)?index|uvi/i);
    await expect.poll(() => isLayerRendered(page, 'UV-Index')).toBe(true);
});
