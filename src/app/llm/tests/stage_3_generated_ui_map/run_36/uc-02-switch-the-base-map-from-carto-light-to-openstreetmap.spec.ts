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

    const cartoLightRadio = layerSwitcher.getByRole('radio', { name: 'Carto Light', exact: true });
    const openStreetMapRadio = layerSwitcher.getByRole('radio', { name: 'OpenStreetMap', exact: true });

    if ((await openStreetMapRadio.count()) === 0) {
        const baseMapSelectorButtons = [
            layerSwitcher.getByRole('button', { name: 'Base maps', exact: true }),
            layerSwitcher.getByRole('button', { name: 'Basemaps', exact: true }),
            layerSwitcher.getByRole('button', { name: 'Base map', exact: true }),
            layerSwitcher.getByRole('button', { name: 'Base layers', exact: true }),
            layerSwitcher.getByRole('button', { name: /base/i })
        ];

        let selectorOpened = false;
        for (const button of baseMapSelectorButtons) {
            if ((await button.count()) === 1) {
                await button.click();
                selectorOpened = true;
                break;
            }
        }

        if (!selectorOpened) {
            throw new Error('Could not locate the base map selector button in the layer switcher.');
        }
    }

    await expect(cartoLightRadio).toHaveCount(1);
    await expect(openStreetMapRadio).toHaveCount(1);

    await expect(cartoLightRadio).toBeChecked();
    await expect(openStreetMapRadio).not.toBeChecked();

    await openStreetMapRadio.click({ force: true });

    await expect(openStreetMapRadio).toBeChecked();
    await expect(cartoLightRadio).not.toBeChecked();
    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('OpenStreetMap');
    await expect.poll(() => getActiveBaseLayerTitle(page)).not.toBe('Carto Light');
});
