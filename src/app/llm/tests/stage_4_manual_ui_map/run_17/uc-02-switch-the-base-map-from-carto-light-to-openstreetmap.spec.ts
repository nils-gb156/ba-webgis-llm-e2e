// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle } from '../../../map-model-helpers';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    await expect(page.getByTestId('map-container')).toBeVisible();
    await expect(page.getByTestId('layer-switcher')).toBeVisible();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');

    const layerSwitcher = page.getByTestId('layer-switcher');
    const baseMapSelector = layerSwitcher.getByRole('combobox').first();

    await expect(baseMapSelector).toBeVisible();

    const tagName = await baseMapSelector.evaluate((element) => element.tagName.toLowerCase());

    if (tagName === 'select') {
        await baseMapSelector.selectOption({ label: 'OpenStreetMap' });
    } else {
        await baseMapSelector.click();
        const listbox = page.getByRole('listbox');
        await expect(listbox).toBeVisible();
        await listbox.getByRole('option', { name: 'OpenStreetMap', exact: true }).click();
    }

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('OpenStreetMap');
    await expect.poll(() => getActiveBaseLayerTitle(page)).not.toBe('Carto Light');
});
