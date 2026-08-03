// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle } from '../../../map-model-helpers';

test('UC2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const layerSwitcher = page.getByTestId('layer-switcher');
    await expect(layerSwitcher).toBeVisible();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');

    const baseMapSectionButton = layerSwitcher.getByRole('button', { name: /base map|basemap/i });
    if ((await baseMapSectionButton.count()) > 0) {
        const toggle = baseMapSectionButton.first();
        const expanded = await toggle.getAttribute('aria-expanded');
        if (expanded === 'false') {
            await toggle.click();
        }
    } else {
        const currentBaseMapButton = layerSwitcher.getByRole('button', { name: 'Carto Light', exact: true });
        if ((await currentBaseMapButton.count()) > 0) {
            await currentBaseMapButton.first().click();
        }
    }

    const openStreetMapRadio = layerSwitcher.getByRole('radio', { name: 'OpenStreetMap', exact: true });
    if ((await openStreetMapRadio.count()) > 0) {
        await openStreetMapRadio.click({ force: true });
        await expect(openStreetMapRadio).toBeChecked();
    } else {
        const openStreetMapOption = layerSwitcher.getByRole('option', { name: 'OpenStreetMap', exact: true });
        if ((await openStreetMapOption.count()) > 0) {
            await openStreetMapOption.click();
        } else {
            const baseMapCombobox = layerSwitcher.getByRole('combobox');
            if ((await baseMapCombobox.count()) > 0) {
                await baseMapCombobox.selectOption({ label: 'OpenStreetMap' });
            } else {
                await layerSwitcher.getByText('OpenStreetMap', { exact: true }).click();
            }
        }
    }

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('OpenStreetMap');
    await expect.poll(() => getActiveBaseLayerTitle(page)).not.toBe('Carto Light');

    const cartoLightRadio = layerSwitcher.getByRole('radio', { name: 'Carto Light', exact: true });
    if ((await cartoLightRadio.count()) > 0) {
        await expect(cartoLightRadio).not.toBeChecked();
    }
});
