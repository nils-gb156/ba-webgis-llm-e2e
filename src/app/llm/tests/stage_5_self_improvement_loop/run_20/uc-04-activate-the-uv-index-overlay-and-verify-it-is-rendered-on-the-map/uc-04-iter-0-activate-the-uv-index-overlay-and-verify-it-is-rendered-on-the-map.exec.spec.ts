// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getActiveBaseLayerTitle, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    await expect(page.getByTestId('map-container')).toBeVisible();
    await expect(page.getByTestId('layer-switcher')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Layer Switcher', exact: true })).toHaveAttribute(
        'aria-pressed',
        'true'
    );

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');

    const uvIndexToggle = page.getByRole('checkbox', { name: 'UV-Index', exact: true });
    await expect(uvIndexToggle).not.toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'UV-Index')).toBe(false);

    const uvIndexTileRequests: string[] = [];
    page.on('request', (request) => {
        const resourceType = request.resourceType();
        const url = request.url();
        if (
            ['image', 'xhr', 'fetch'].includes(resourceType) &&
            /(uv-?index|uvi)/i.test(url)
        ) {
            uvIndexTileRequests.push(url);
        }
    });

    await uvIndexToggle.click({ force: true });

    await expect(uvIndexToggle).toBeChecked();
    await expect.poll(() => uvIndexTileRequests.length).toBeGreaterThan(0);
    await expect.poll(() => isLayerRendered(page, 'UV-Index')).toBe(true);
});
