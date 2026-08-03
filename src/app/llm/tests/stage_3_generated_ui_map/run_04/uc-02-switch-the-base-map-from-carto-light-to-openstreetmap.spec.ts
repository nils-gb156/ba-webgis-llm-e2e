// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle } from '../../../map-model-helpers';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const mapContainer = page.getByTestId('map-container');
    const layerSwitcher = page.getByTestId('layer-switcher');

    await expect(mapContainer).toBeVisible();
    await expect(layerSwitcher).toBeVisible();
    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');

    for (const candidate of [
        layerSwitcher.getByRole('button', { name: /base maps?/i }),
        layerSwitcher.getByRole('button', { name: /base layers?/i }),
        layerSwitcher.getByRole('button', { name: /basemap/i }),
        layerSwitcher.getByRole('button', { name: /background maps?/i }),
        layerSwitcher.getByRole('button', { name: /background layers?/i })
    ]) {
        if ((await candidate.count()) > 0) {
            const toggle = candidate.first();
            const expanded = await toggle.getAttribute('aria-expanded');
            if (expanded !== 'true') {
                await toggle.click();
            }
            break;
        }
    }

    const openStreetMapRadio = layerSwitcher.getByRole('radio', {
        name: 'OpenStreetMap',
        exact: true
    });
    const cartoLightRadio = layerSwitcher.getByRole('radio', {
        name: 'Carto Light',
        exact: true
    });

    let selected = false;

    if ((await openStreetMapRadio.count()) > 0) {
        await openStreetMapRadio.click({ force: true });
        selected = true;
    }

    if (!selected) {
        const openStreetMapOption = layerSwitcher.getByRole('option', {
            name: 'OpenStreetMap',
            exact: true
        });
        if ((await openStreetMapOption.count()) > 0) {
            await openStreetMapOption.click();
            selected = true;
        }
    }

    if (!selected) {
        const openStreetMapMenuItemRadio = layerSwitcher.getByRole('menuitemradio', {
            name: 'OpenStreetMap',
            exact: true
        });
        if ((await openStreetMapMenuItemRadio.count()) > 0) {
            await openStreetMapMenuItemRadio.click();
            selected = true;
        }
    }

    if (!selected) {
        const openStreetMapButton = layerSwitcher.getByRole('button', {
            name: 'OpenStreetMap',
            exact: true
        });
        if ((await openStreetMapButton.count()) > 0) {
            await openStreetMapButton.click();
            selected = true;
        }
    }

    if (!selected) {
        const baseMapCombobox = layerSwitcher.getByRole('combobox').first();
        await baseMapCombobox.selectOption({ label: 'OpenStreetMap' });
    }

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('OpenStreetMap');
    await expect.poll(() => getActiveBaseLayerTitle(page)).not.toBe('Carto Light');

    if ((await openStreetMapRadio.count()) > 0) {
        await expect(openStreetMapRadio).toBeChecked();
    }
    if ((await cartoLightRadio.count()) > 0) {
        await expect(cartoLightRadio).not.toBeChecked();
    }
});
