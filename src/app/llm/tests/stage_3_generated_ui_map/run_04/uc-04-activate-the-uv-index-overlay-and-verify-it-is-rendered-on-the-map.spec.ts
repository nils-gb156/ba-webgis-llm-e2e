// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../map-model-helpers';

test('UC4 - Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const layerSwitcher = page.getByTestId('layer-switcher');
    await expect(layerSwitcher).toBeVisible();

    const uvIndexToggle = layerSwitcher.getByRole('checkbox', { name: 'UV-Index', exact: true });
    await expect(uvIndexToggle).toBeVisible();

    await expect.poll(() => isLayerRendered(page, 'UV-Index')).toBe(false);
    await expect(uvIndexToggle).not.toBeChecked();

    await uvIndexToggle.click({ force: true });

    await expect(uvIndexToggle).toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'UV-Index')).toBe(true);
});
