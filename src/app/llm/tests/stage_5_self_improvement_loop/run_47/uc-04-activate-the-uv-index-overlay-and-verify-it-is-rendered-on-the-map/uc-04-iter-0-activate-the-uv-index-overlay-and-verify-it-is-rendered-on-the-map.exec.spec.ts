// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getActiveBaseLayerTitle, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const layerSwitcher = page.getByTestId('layer-switcher');
    const mapContainer = page.getByTestId('map-container');
    const uvIndexCheckbox = page.getByRole('checkbox', { name: 'UV-Index', exact: true });

    await expect(layerSwitcher).toBeVisible();
    await expect(mapContainer).toBeVisible();
    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await page.waitForLoadState('networkidle');

    await expect(uvIndexCheckbox).not.toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'UV-Index')).toBe(false);

    const uvIndexRequests: string[] = [];
    page.on('request', (request) => {
        const url = request.url().toLowerCase();
        const resourceType = request.resourceType();
        const looksLikeUvIndexLayerRequest =
            url.includes('uv-index') ||
            url.includes('uv_index') ||
            url.includes('uvindex') ||
            url.includes('uvi');

        if (
            looksLikeUvIndexLayerRequest &&
            (resourceType === 'image' || resourceType === 'fetch' || resourceType === 'xhr')
        ) {
            uvIndexRequests.push(request.url());
        }
    });

    await uvIndexCheckbox.click({ force: true });

    await expect(uvIndexCheckbox).toBeChecked();
    await expect.poll(() => uvIndexRequests.length).toBeGreaterThan(0);
    await expect.poll(() => isLayerRendered(page, 'UV-Index')).toBe(true);
});
