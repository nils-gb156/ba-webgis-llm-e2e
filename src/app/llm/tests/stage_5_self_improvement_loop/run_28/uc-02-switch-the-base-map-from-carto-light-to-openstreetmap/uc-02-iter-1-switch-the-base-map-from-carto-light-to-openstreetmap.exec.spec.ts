// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getActiveBaseLayerTitle } from '../../../../map-model-helpers';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const layerSwitcher = page.getByTestId('layer-switcher');
    const layerSwitcherToggle = page.getByTestId('layer-switcher-toggle');
    const basemapCombobox = page.getByRole('combobox', { name: 'Basemaps', exact: true });

    if (!(await layerSwitcher.isVisible())) {
        await layerSwitcherToggle.click();
    }

    await expect(layerSwitcher).toBeVisible();
    await expect(basemapCombobox).toBeVisible();

    const getDisplayedBasemapValue = async () =>
        basemapCombobox.evaluate((element) => {
            if (element instanceof HTMLSelectElement) {
                return element.selectedOptions.item(0)?.textContent?.trim() ?? element.value;
            }
            if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
                return element.value;
            }
            return element.textContent?.trim() ?? '';
        });

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(() => getDisplayedBasemapValue()).toBe('Carto Light');

    const tagName = await basemapCombobox.evaluate((element) => element.tagName.toLowerCase());

    await basemapCombobox.click();

    if (tagName === 'select') {
        await basemapCombobox.selectOption({ label: 'OpenStreetMap' });
    } else {
        const osmOption = page.getByRole('option', { name: 'OpenStreetMap', exact: true });
        await expect(osmOption).toBeVisible();
        await osmOption.click();
    }

    await expect.poll(() => getDisplayedBasemapValue()).toBe('OpenStreetMap');
    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('OpenStreetMap');
    await expect.poll(() => getActiveBaseLayerTitle(page)).not.toBe('Carto Light');
});
