// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getActiveBaseLayerTitle } from '../../../../map-model-helpers';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const layerSwitcher = page.getByTestId('layer-switcher');
    const basemapCombobox = page.getByRole('combobox', { name: 'Basemaps', exact: true });

    await expect(layerSwitcher).toBeVisible();
    await expect(basemapCombobox).toBeVisible();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect
        .poll(() =>
            basemapCombobox.evaluate((element) => {
                const select = element as HTMLSelectElement;
                return select.selectedOptions[0]?.textContent?.trim();
            })
        )
        .toBe('Carto Light');

    await basemapCombobox.click();
    await basemapCombobox.selectOption({ label: 'OpenStreetMap' });

    await expect
        .poll(() =>
            basemapCombobox.evaluate((element) => {
                const select = element as HTMLSelectElement;
                return select.selectedOptions[0]?.textContent?.trim();
            })
        )
        .toBe('OpenStreetMap');
    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('OpenStreetMap');
});
