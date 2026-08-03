// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle } from '../../../map-model-helpers';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const layerSwitcher = page.getByTestId('layer-switcher');
    await expect(layerSwitcher).toBeVisible();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');

    const cartoLightOption = layerSwitcher.getByRole('radio', { name: 'Carto Light', exact: true });
    const openStreetMapOption = layerSwitcher.getByRole('radio', { name: 'OpenStreetMap', exact: true });

    if (!(await openStreetMapOption.isVisible())) {
        const baseMapSelectorToggle = layerSwitcher.getByRole('button', {
            name: /base ?map|base ?maps|basemap|base layer|background/i
        });

        if ((await baseMapSelectorToggle.count()) > 0) {
            const toggle = baseMapSelectorToggle.first();
            const expanded = await toggle.getAttribute('aria-expanded');

            if (expanded !== 'true') {
                await toggle.click();
            }
        }
    }

    await expect(cartoLightOption).toBeChecked();
    await expect(openStreetMapOption).toBeVisible();

    await openStreetMapOption.click({ force: true });

    await expect(openStreetMapOption).toBeChecked();
    await expect(cartoLightOption).not.toBeChecked();
    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('OpenStreetMap');
});
