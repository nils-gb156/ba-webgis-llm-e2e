// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle } from '../../../map-model-helpers';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    await expect(page.getByTestId('map-container')).toBeVisible();

    const layerSwitcher = page.getByTestId('layer-switcher');
    await expect(layerSwitcher).toBeVisible();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');

    const baseMapSelector = layerSwitcher.getByRole('combobox').first();
    await expect(baseMapSelector).toBeVisible();

    await baseMapSelector.click();

    const selectorTagName = await baseMapSelector.evaluate((element) => element.tagName);
    if (selectorTagName === 'SELECT') {
        await baseMapSelector.selectOption({ label: 'OpenStreetMap' });
    } else {
        const openStreetMapOption = page.getByRole('option', { name: 'OpenStreetMap', exact: true });
        await expect(openStreetMapOption).toBeVisible();
        await openStreetMapOption.click();
    }

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('OpenStreetMap');
    await expect.poll(() => getActiveBaseLayerTitle(page)).not.toBe('Carto Light');
});
