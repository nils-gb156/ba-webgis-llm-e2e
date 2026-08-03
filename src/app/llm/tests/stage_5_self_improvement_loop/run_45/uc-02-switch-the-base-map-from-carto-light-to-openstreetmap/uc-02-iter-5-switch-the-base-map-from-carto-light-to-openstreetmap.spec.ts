// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle } from '../../../../map-model-helpers';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    await expect(page.getByRole('application', { name: 'webgis map' })).toBeVisible();

    const layerSwitcher = page.getByTestId('layer-switcher');
    const layerSwitcherToggle = page.getByTestId('layer-switcher-toggle');

    await expect(layerSwitcherToggle).toBeVisible();

    if (!(await layerSwitcher.isVisible())) {
        await expect(layerSwitcherToggle).toHaveAttribute('aria-pressed', 'false');
        await layerSwitcherToggle.click();
    }

    await expect(layerSwitcher).toBeVisible();

    const basemapSelector = layerSwitcher.getByRole('combobox', { name: 'Basemaps', exact: true });

    await expect(basemapSelector).toBeVisible();

    const readSelectedBasemapLabel = async (): Promise<string | undefined> => {
        return await basemapSelector.evaluate((element) => {
            const selectElement =
                element instanceof HTMLSelectElement
                    ? element
                    : element.querySelector('select');

            if (selectElement instanceof HTMLSelectElement) {
                return selectElement.selectedOptions[0]?.textContent?.trim();
            }

            return undefined;
        });
    };

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(readSelectedBasemapLabel).toBe('Carto Light');

    await basemapSelector.selectOption({ label: 'OpenStreetMap' });

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('OpenStreetMap');
    await expect.poll(() => getActiveBaseLayerTitle(page)).not.toBe('Carto Light');
    await expect.poll(readSelectedBasemapLabel).toBe('OpenStreetMap');
    await expect.poll(readSelectedBasemapLabel).not.toBe('Carto Light');
});
