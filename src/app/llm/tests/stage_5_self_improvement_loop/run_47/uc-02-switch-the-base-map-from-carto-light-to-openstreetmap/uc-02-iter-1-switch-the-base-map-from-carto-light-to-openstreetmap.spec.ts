// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle } from '../../../../map-model-helpers';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const layerSwitcher = page.getByTestId('layer-switcher');
    await expect(layerSwitcher).toBeVisible();

    const basemapSelector = layerSwitcher.getByRole('combobox', { name: 'Basemaps', exact: true });
    await expect(basemapSelector).toBeVisible();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect(basemapSelector).toContainText('Carto Light');

    await basemapSelector.click();

    const listbox = page.getByRole('listbox');
    await expect(listbox).toBeVisible();

    const cartoLightOption = listbox.getByRole('option', { name: 'Carto Light', exact: true });
    const openStreetMapOption = listbox.getByRole('option', { name: 'OpenStreetMap', exact: true });

    await expect(cartoLightOption).toBeVisible();
    await expect(openStreetMapOption).toBeVisible();
    await expect(cartoLightOption).toHaveAttribute('aria-selected', 'true');

    await openStreetMapOption.click();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('OpenStreetMap');
    await expect(basemapSelector).toContainText('OpenStreetMap');

    if ((await basemapSelector.getAttribute('aria-expanded')) !== 'true') {
        await basemapSelector.click();
    }

    await expect(listbox).toBeVisible();
    await expect(listbox.getByRole('option', { name: 'OpenStreetMap', exact: true })).toHaveAttribute('aria-selected', 'true');
    await expect(listbox.getByRole('option', { name: 'Carto Light', exact: true })).not.toHaveAttribute('aria-selected', 'true');
});
