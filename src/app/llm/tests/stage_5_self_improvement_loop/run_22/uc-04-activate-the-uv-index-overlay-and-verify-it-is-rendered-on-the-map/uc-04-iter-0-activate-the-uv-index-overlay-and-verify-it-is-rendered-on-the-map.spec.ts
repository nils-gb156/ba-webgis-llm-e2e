// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const layerSwitcher = page.getByTestId('layer-switcher');
    const layerSwitcherToggle = page.getByTestId('layer-switcher-toggle');
    const uvIndexCheckbox = layerSwitcher.getByRole('checkbox', { name: 'UV-Index', exact: true });

    await expect(layerSwitcher).toBeVisible();
    await expect(layerSwitcherToggle).toHaveAttribute('aria-pressed', 'true');
    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect(uvIndexCheckbox).not.toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'UV-Index')).toBe(false);

    await page.waitForLoadState('networkidle');

    const overlayRequestUrls: string[] = [];
    page.on('request', (request) => {
        if (['image', 'fetch', 'xhr'].includes(request.resourceType())) {
            overlayRequestUrls.push(request.url());
        }
    });

    const overlayResponsePromise = page.waitForResponse((response) => {
        return ['image', 'fetch', 'xhr'].includes(response.request().resourceType()) && response.ok();
    });

    await uvIndexCheckbox.click({ force: true });

    await expect(uvIndexCheckbox).toBeChecked();

    const overlayResponse = await overlayResponsePromise;
    expect(overlayResponse.ok()).toBe(true);
    await expect.poll(() => overlayRequestUrls.length).toBeGreaterThan(0);
    await expect.poll(() => isLayerRendered(page, 'UV-Index')).toBe(true);
});
