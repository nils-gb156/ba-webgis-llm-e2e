// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle } from '../../../../map-model-helpers';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const layerSwitcher = page.getByTestId('layer-switcher');
    const basemapSelector = page.getByRole('combobox', { name: 'Basemaps', exact: true });

    await expect(layerSwitcher).toBeVisible();
    await expect(basemapSelector).toBeVisible();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');

    const readDisplayedBasemapLabel = async () => {
        return await basemapSelector.evaluate((element) => {
            const directSelect = element instanceof HTMLSelectElement ? element : null;
            const nestedSelect = !directSelect ? element.querySelector('select') : null;
            const select = directSelect ?? nestedSelect;

            if (select instanceof HTMLSelectElement) {
                return select.selectedOptions.item(0)?.textContent?.trim() ?? select.value;
            }

            const ariaValueText = element.getAttribute('aria-valuetext');
            if (ariaValueText) {
                return ariaValueText.trim();
            }

            return (element as HTMLElement).innerText.trim();
        });
    };

    await expect.poll(() => readDisplayedBasemapLabel()).toMatch(/Carto Light/);

    const isDirectSelect = await basemapSelector.evaluate((element) => element instanceof HTMLSelectElement);
    if (isDirectSelect) {
        await basemapSelector.selectOption({ label: 'OpenStreetMap' });
    } else {
        const nestedSelect = basemapSelector.locator('select').first();
        if ((await nestedSelect.count()) > 0) {
            await nestedSelect.selectOption({ label: 'OpenStreetMap' });
        } else {
            await basemapSelector.click();
            const openStreetMapOption = page.getByRole('option', { name: 'OpenStreetMap', exact: true });
            await expect(openStreetMapOption).toBeVisible();
            await openStreetMapOption.click();
        }
    }

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('OpenStreetMap');
    await expect.poll(() => getActiveBaseLayerTitle(page)).not.toBe('Carto Light');
    await expect.poll(() => readDisplayedBasemapLabel()).toMatch(/OpenStreetMap/);
});
