// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle } from '../../../../map-model-helpers';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const layerSwitcher = page.getByTestId('layer-switcher');
    const layerSwitcherToggle = page.getByTestId('layer-switcher-toggle');
    const basemapSelector = layerSwitcher.getByRole('combobox', { name: 'Basemaps', exact: true });

    const togglePressed = await layerSwitcherToggle.getAttribute('aria-pressed');
    if (togglePressed !== 'true') {
        await layerSwitcherToggle.click();
    }

    await expect(layerSwitcher).toBeVisible();
    await expect(layerSwitcherToggle).toHaveAttribute('aria-pressed', 'true');
    await expect(basemapSelector).toBeVisible();

    const readSelectedBasemapLabels = async (): Promise<string[]> => {
        return basemapSelector.evaluate((element) => {
            if (element instanceof HTMLSelectElement) {
                return Array.from(element.selectedOptions)
                    .map((option) => option.textContent?.trim() ?? '')
                    .filter((text) => text.length > 0);
            }

            if (element instanceof HTMLInputElement) {
                const value = element.value.trim();
                return value ? [value] : [];
            }

            const text = element.textContent?.trim() ?? '';
            return text ? [text] : [];
        });
    };

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(readSelectedBasemapLabels).toEqual(['Carto Light']);

    const selectorTagName = await basemapSelector.evaluate((element) => element.tagName.toLowerCase());

    if (selectorTagName === 'select') {
        await basemapSelector.selectOption({ label: 'OpenStreetMap' });
    } else {
        await basemapSelector.click();
        await page.getByRole('option', { name: 'OpenStreetMap', exact: true }).click();
    }

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('OpenStreetMap');
    await expect.poll(readSelectedBasemapLabels).toEqual(['OpenStreetMap']);
    await expect.poll(() => getActiveBaseLayerTitle(page)).not.toBe('Carto Light');
});
