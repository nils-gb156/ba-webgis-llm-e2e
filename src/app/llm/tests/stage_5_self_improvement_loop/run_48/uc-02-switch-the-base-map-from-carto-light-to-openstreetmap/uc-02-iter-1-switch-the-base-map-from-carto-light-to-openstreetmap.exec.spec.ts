// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getActiveBaseLayerTitle } from '../../../../map-model-helpers';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const layerSwitcher = page.getByTestId('layer-switcher');
    const layerSwitcherToggle = page.getByTestId('layer-switcher-toggle');
    if (!(await layerSwitcher.isVisible())) {
        await expect(layerSwitcherToggle).toHaveAttribute('aria-pressed', 'false');
        await layerSwitcherToggle.click();
    }
    await expect(layerSwitcher).toBeVisible();

    const basemapSelector = page.getByRole('combobox', { name: 'Basemaps', exact: true });
    await expect(basemapSelector).toBeVisible();

    const readSelectedBasemapLabel = async () =>
        basemapSelector.evaluate((element) => {
            if (element instanceof HTMLSelectElement) {
                return element.selectedOptions.item(0)?.textContent?.replace(/\s+/g, ' ').trim();
            }

            if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
                const value = element.value?.replace(/\s+/g, ' ').trim();
                if (value) {
                    return value;
                }
            }

            const ariaValueText = element.getAttribute('aria-valuetext')?.replace(/\s+/g, ' ').trim();
            if (ariaValueText) {
                return ariaValueText;
            }

            return element.textContent?.replace(/\s+/g, ' ').trim();
        });

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(() => readSelectedBasemapLabel()).toBe('Carto Light');

    const isNativeSelect = await basemapSelector.evaluate((element) => element instanceof HTMLSelectElement);

    if (isNativeSelect) {
        await basemapSelector.selectOption({ label: 'OpenStreetMap' });
    } else {
        await basemapSelector.click();
        const openStreetMapOption = page.getByRole('option', { name: 'OpenStreetMap', exact: true });
        await expect(openStreetMapOption).toBeVisible();
        await openStreetMapOption.click();
    }

    await expect.poll(() => readSelectedBasemapLabel()).toBe('OpenStreetMap');
    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('OpenStreetMap');
    await expect.poll(() => getActiveBaseLayerTitle(page)).not.toBe('Carto Light');
});
