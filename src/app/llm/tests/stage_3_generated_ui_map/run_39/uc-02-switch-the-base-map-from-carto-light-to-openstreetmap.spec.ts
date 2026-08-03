// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle } from '../../../map-model-helpers';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const layerSwitcher = page.getByTestId('layer-switcher');
    await expect(layerSwitcher).toBeVisible();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');

    const openStreetMapRadio = layerSwitcher.getByRole('radio', {
        name: 'OpenStreetMap',
        exact: true
    });

    if (await openStreetMapRadio.isVisible()) {
        await openStreetMapRadio.click({ force: true });
    } else {
        const currentBaseMapButton = layerSwitcher.getByRole('button', {
            name: 'Carto Light',
            exact: true
        });

        if (await currentBaseMapButton.isVisible()) {
            await currentBaseMapButton.click();
        } else {
            const baseMapSelectorButton = layerSwitcher
                .getByRole('button', { name: /base map|basemap|base layer/i })
                .first();

            if (await baseMapSelectorButton.isVisible()) {
                await baseMapSelectorButton.click();
            }
        }

        if (await openStreetMapRadio.isVisible()) {
            await openStreetMapRadio.click({ force: true });
        } else {
            const openStreetMapOption = page.getByRole('option', {
                name: 'OpenStreetMap',
                exact: true
            });

            if (await openStreetMapOption.isVisible()) {
                await openStreetMapOption.click();
            } else {
                const openStreetMapMenuItem = page.getByRole('menuitemradio', {
                    name: 'OpenStreetMap',
                    exact: true
                });

                if (await openStreetMapMenuItem.isVisible()) {
                    await openStreetMapMenuItem.click();
                } else {
                    await layerSwitcher.getByText('OpenStreetMap', { exact: true }).click();
                }
            }
        }
    }

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('OpenStreetMap');
    await expect.poll(() => getActiveBaseLayerTitle(page)).not.toBe('Carto Light');

    if (await openStreetMapRadio.count()) {
        await expect(openStreetMapRadio).toBeChecked();

        const cartoLightRadio = layerSwitcher.getByRole('radio', {
            name: 'Carto Light',
            exact: true
        });

        if (await cartoLightRadio.count()) {
            await expect(cartoLightRadio).not.toBeChecked();
        }
    }
});
