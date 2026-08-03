// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle } from '../../../map-model-helpers';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
    await page.waitForLoadState('domcontentloaded');

    const layerSwitcher = page.getByTestId('layer-switcher');

    await expect(layerSwitcher).toBeVisible();
    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');

    const baseMapSelectorToggle = layerSwitcher.getByRole('button', {
        name: /base maps?|basemaps?|background maps?/i
    });

    if ((await baseMapSelectorToggle.count()) > 0) {
        const toggle = baseMapSelectorToggle.first();
        const expanded = await toggle.getAttribute('aria-expanded');
        if (expanded === 'false') {
            await toggle.click();
        }
    }

    const openStreetMapRadio = layerSwitcher.getByRole('radio', {
        name: 'OpenStreetMap',
        exact: true
    });

    if ((await openStreetMapRadio.count()) > 0) {
        await expect(openStreetMapRadio).toBeVisible();
        await openStreetMapRadio.click({ force: true });
        await expect(openStreetMapRadio).toBeChecked();

        const cartoLightRadio = layerSwitcher.getByRole('radio', {
            name: 'Carto Light',
            exact: true
        });
        if ((await cartoLightRadio.count()) > 0) {
            await expect(cartoLightRadio).not.toBeChecked();
        }
    } else {
        const openStreetMapOption = layerSwitcher.getByRole('button', {
            name: 'OpenStreetMap',
            exact: true
        });
        await expect(openStreetMapOption).toBeVisible();
        await openStreetMapOption.click();
    }

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('OpenStreetMap');
    await expect.poll(async () => (await getActiveBaseLayerTitle(page)) === 'Carto Light').toBe(false);
});
