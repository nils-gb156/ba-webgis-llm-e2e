// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    await expect(page.getByTestId('map-container')).toBeVisible();
    await expect(page.getByTestId('layer-switcher-toggle')).toBeVisible();

    const layerSwitcherPanel = page.getByTestId('layer-switcher');
    const layerSwitcherToggle = page.getByTestId('layer-switcher-toggle');

    if (!(await layerSwitcherPanel.isVisible())) {
        await expect(layerSwitcherToggle).toHaveAttribute('aria-pressed', 'false');
        await layerSwitcherToggle.click();
    }

    await expect(layerSwitcherPanel).toBeVisible();

    const uvIndexCheckbox = layerSwitcherPanel.getByRole('checkbox', {
        name: 'UV-Index',
        exact: true
    });

    await expect(uvIndexCheckbox).toBeVisible();
    await expect(uvIndexCheckbox).not.toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'UV-Index')).toBe(false);

    await page.waitForLoadState('networkidle');

    const overlayRequests: string[] = [];
    const relevantResourceTypes = new Set(['image', 'xhr', 'fetch']);

    page.on('request', (request) => {
        if (relevantResourceTypes.has(request.resourceType())) {
            overlayRequests.push(request.url());
        }
    });

    const overlayResponsePromise = page.waitForResponse((response) => {
        return relevantResourceTypes.has(response.request().resourceType()) && response.ok();
    });

    await uvIndexCheckbox.click({ force: true });

    await expect(uvIndexCheckbox).toBeChecked();
    await overlayResponsePromise;
    await expect.poll(() => overlayRequests.length).toBeGreaterThan(0);
    await expect.poll(() => isLayerRendered(page, 'UV-Index')).toBe(true);
});
