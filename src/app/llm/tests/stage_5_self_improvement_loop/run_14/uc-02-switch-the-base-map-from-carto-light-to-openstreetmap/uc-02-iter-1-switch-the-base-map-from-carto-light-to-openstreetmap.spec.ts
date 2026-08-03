// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle } from '../../../../map-model-helpers';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const layerSwitcher = page.getByTestId('layer-switcher');
    await expect(layerSwitcher).toBeVisible();

    const baseMapSelector = layerSwitcher.getByRole('combobox', { name: 'Basemaps', exact: true });
    await expect(baseMapSelector).toBeVisible();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect(baseMapSelector).toContainText('Carto Light');

    await baseMapSelector.click();

    const listbox = page.getByRole('listbox');
    await expect(listbox).toBeVisible();

    const openStreetMapOption = listbox.getByRole('option', { name: 'OpenStreetMap', exact: true });
    await expect(openStreetMapOption).toBeVisible();
    await openStreetMapOption.click();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('OpenStreetMap');
    await expect(baseMapSelector).toContainText('OpenStreetMap');

    await baseMapSelector.click();
    await expect(listbox).toBeVisible();

    await expect(listbox.getByRole('option', { name: 'OpenStreetMap', exact: true, selected: true })).toHaveCount(1);
    await expect(listbox.getByRole('option', { name: 'Carto Light', exact: true, selected: true })).toHaveCount(0);
});
