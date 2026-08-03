// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle } from '../../../../map-model-helpers';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const layerSwitcherToggle = page.getByTestId('layer-switcher-toggle');
    const basemapCombobox = page.getByRole('combobox', { name: 'Basemaps', exact: true });

    await expect(layerSwitcherToggle).toBeVisible();

    if (!(await basemapCombobox.isVisible())) {
        const pressed = await layerSwitcherToggle.getAttribute('aria-pressed');
        if (pressed !== 'true') {
            await layerSwitcherToggle.click();
        }
    }

    await expect(basemapCombobox).toBeVisible();

    const getSelectedBasemapLabel = async () =>
        await basemapCombobox.evaluate((element) => {
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

    const tagName = await basemapCombobox.evaluate((element) => element.tagName.toLowerCase());

    if (tagName === 'select') {
        await basemapCombobox.selectOption({ label: 'OpenStreetMap' });
    } else {
        await basemapCombobox.click();
        const osmOption = page.getByRole('option', { name: 'OpenStreetMap', exact: true });
        await expect(osmOption).toBeVisible();
        await osmOption.click();
    }

    await expect.poll(() => getSelectedBasemapLabel()).toBe('OpenStreetMap');
    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('OpenStreetMap');
    await expect.poll(() => getActiveBaseLayerTitle(page)).not.toBe('Carto Light');
});
