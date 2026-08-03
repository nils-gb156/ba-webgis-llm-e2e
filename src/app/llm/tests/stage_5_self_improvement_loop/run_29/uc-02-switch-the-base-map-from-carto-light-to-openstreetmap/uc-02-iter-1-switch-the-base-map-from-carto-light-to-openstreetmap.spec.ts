// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle } from '../../../../map-model-helpers';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const layerSwitcher = page.getByTestId('layer-switcher');
    const basemapSelector = page.getByRole('combobox', { name: 'Basemaps', exact: true });

    const getSelectedBasemapLabel = async () =>
        basemapSelector.evaluate((element) => {
            if (element instanceof HTMLSelectElement) {
                const selectedOption = element.selectedOptions?.item(0);
                return (selectedOption?.textContent ?? element.value ?? '').trim();
            }

            if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
                return element.value.trim();
            }

            const htmlElement = element as HTMLElement;
            return (
                htmlElement.getAttribute('aria-valuetext') ??
                htmlElement.getAttribute('data-value') ??
                htmlElement.textContent ??
                ''
            ).trim();
        });

    await expect(layerSwitcher).toBeVisible();
    await expect(basemapSelector).toBeVisible();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(() => getSelectedBasemapLabel()).toBe('Carto Light');

    await basemapSelector.selectOption({ label: 'OpenStreetMap' });

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('OpenStreetMap');
    await expect.poll(() => getActiveBaseLayerTitle(page)).not.toBe('Carto Light');

    await expect.poll(() => getSelectedBasemapLabel()).toBe('OpenStreetMap');
    await expect.poll(() => getSelectedBasemapLabel()).not.toBe('Carto Light');
});
