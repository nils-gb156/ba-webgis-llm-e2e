// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle } from '../../../map-model-helpers';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const layerSwitcher = page.getByTestId('layer-switcher');
    await expect(layerSwitcher).toBeVisible();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');

    const cartoLightRadio = layerSwitcher.getByRole('radio', { name: 'Carto Light', exact: true });
    const openStreetMapRadio = layerSwitcher.getByRole('radio', {
        name: 'OpenStreetMap',
        exact: true
    });

    if (!(await openStreetMapRadio.isVisible())) {
        const baseMapTab = layerSwitcher
            .getByRole('tab', { name: /base\s*maps?|basemap|background/i })
            .first();
        if ((await baseMapTab.count()) > 0) {
            await baseMapTab.click();
        }
    }

    if (!(await openStreetMapRadio.isVisible())) {
        const baseMapButton = layerSwitcher
            .getByRole('button', { name: /base\s*maps?|basemap|background/i })
            .first();
        if ((await baseMapButton.count()) > 0) {
            await baseMapButton.click();
        }
    }

    await expect(cartoLightRadio).toBeVisible();
    await expect(openStreetMapRadio).toBeVisible();
    await expect(cartoLightRadio).toBeChecked();
    await expect(openStreetMapRadio).not.toBeChecked();

    await openStreetMapRadio.click({ force: true });

    await expect(openStreetMapRadio).toBeChecked();
    await expect(cartoLightRadio).not.toBeChecked();
    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('OpenStreetMap');
});
