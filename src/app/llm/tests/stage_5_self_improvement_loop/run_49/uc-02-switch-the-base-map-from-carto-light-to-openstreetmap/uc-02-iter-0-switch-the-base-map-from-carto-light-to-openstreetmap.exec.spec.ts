// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getActiveBaseLayerTitle } from '../../../../map-model-helpers';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const layerSwitcher = page.getByTestId('layer-switcher');
    const layerSwitcherToggle = page.getByTestId('layer-switcher-toggle');

    if (!(await layerSwitcher.isVisible())) {
        await expect(layerSwitcherToggle).toBeVisible();
        await layerSwitcherToggle.click();
    }

    await expect(layerSwitcher).toBeVisible();

    const basemapSelect = layerSwitcher.getByRole('combobox', { name: 'Basemaps', exact: true });

    await expect(basemapSelect).toBeVisible();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(() =>
        basemapSelect.evaluate((element) => {
            const select = element as HTMLSelectElement;
            return select.selectedOptions[0]?.textContent?.trim();
        })
    ).toBe('Carto Light');

    await basemapSelect.selectOption({ label: 'OpenStreetMap' });

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('OpenStreetMap');
    await expect.poll(() =>
        basemapSelect.evaluate((element) => {
            const select = element as HTMLSelectElement;
            return select.selectedOptions[0]?.textContent?.trim();
        })
    ).toBe('OpenStreetMap');
});
