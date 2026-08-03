// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle } from '../../../map-model-helpers';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');

    const layerSwitcher = page.getByTestId('layer-switcher');
    await expect(layerSwitcher).toBeVisible();

    const openStreetMapRadio = layerSwitcher.getByRole('radio', {
        name: 'OpenStreetMap',
        exact: true
    });
    const cartoLightRadio = layerSwitcher.getByRole('radio', {
        name: 'Carto Light',
        exact: true
    });

    if (!(await openStreetMapRadio.isVisible())) {
        const currentBaseMapButton = layerSwitcher.getByRole('button', {
            name: 'Carto Light',
            exact: true
        });
        if ((await currentBaseMapButton.count()) > 0 && (await currentBaseMapButton.first().isVisible())) {
            await currentBaseMapButton.first().click();
        } else {
            const baseMapButton = layerSwitcher.getByRole('button', {
                name: /base map|basemap/i
            });
            if ((await baseMapButton.count()) > 0 && (await baseMapButton.first().isVisible())) {
                await baseMapButton.first().click();
            } else {
                const baseMapCombobox = layerSwitcher.getByRole('combobox', {
                    name: /base map|basemap/i
                });
                if ((await baseMapCombobox.count()) > 0 && (await baseMapCombobox.first().isVisible())) {
                    await baseMapCombobox.first().click();
                }
            }
        }
    }

    await expect(openStreetMapRadio).toBeVisible();
    await expect(cartoLightRadio).toBeVisible();
    await expect(cartoLightRadio).toBeChecked();

    await openStreetMapRadio.click({ force: true });
    await expect(openStreetMapRadio).toBeChecked();
    await expect(cartoLightRadio).not.toBeChecked();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('OpenStreetMap');
});
