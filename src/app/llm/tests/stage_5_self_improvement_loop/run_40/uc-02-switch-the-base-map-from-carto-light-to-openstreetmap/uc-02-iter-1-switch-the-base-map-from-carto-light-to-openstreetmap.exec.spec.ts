// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getActiveBaseLayerTitle } from '../../../../map-model-helpers';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
    await page.waitForLoadState('domcontentloaded');

    const layerSwitcher = page.getByTestId('layer-switcher');
    if (!(await layerSwitcher.isVisible())) {
        await page.getByTestId('layer-switcher-toggle').click();
    }
    await expect(layerSwitcher).toBeVisible();

    const basemapSelector = layerSwitcher.getByRole('combobox', { name: 'Basemaps', exact: true });
    await expect(basemapSelector).toBeVisible();

    const getSelectedBasemapLabel = async () =>
        await basemapSelector.evaluate((element) => {
            if (element instanceof HTMLSelectElement) {
                return element.selectedOptions.item(0)?.textContent?.trim() ?? '';
            }
            if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
                return element.value.trim();
            }
            return element.textContent?.trim() ?? '';
        });

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(() => getSelectedBasemapLabel()).toBe('Carto Light');

    const basemapSelectorTagName = await basemapSelector.evaluate((element) => element.tagName);
    if (basemapSelectorTagName === 'SELECT') {
        await basemapSelector.selectOption({ label: 'OpenStreetMap' });
    } else {
        await basemapSelector.click();
        const listbox = page.getByRole('listbox');
        await expect(listbox).toBeVisible();
        await listbox.getByRole('option', { name: 'OpenStreetMap', exact: true }).click();
    }

    await expect.poll(() => getSelectedBasemapLabel()).toBe('OpenStreetMap');
    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('OpenStreetMap');
    await expect.poll(() => getSelectedBasemapLabel()).not.toBe('Carto Light');
    await expect.poll(() => getActiveBaseLayerTitle(page)).not.toBe('Carto Light');
});
