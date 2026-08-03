// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
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

    const getDisplayedBasemapLabel = async (): Promise<string | undefined> => {
        return await basemapSelector.evaluate((element) => {
            if (element instanceof HTMLSelectElement) {
                const selectedOption = element.options.item(element.selectedIndex);
                return (
                    selectedOption?.text?.trim() ||
                    selectedOption?.label?.trim() ||
                    element.value?.trim() ||
                    undefined
                );
            }

            if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
                const value = element.value.trim();
                if (value) {
                    return value;
                }
            }

            const ariaValueText = element.getAttribute('aria-valuetext')?.trim();
            if (ariaValueText) {
                return ariaValueText;
            }

            const innerText =
                'innerText' in element ? (element as HTMLElement).innerText?.trim() : undefined;
            return innerText || undefined;
        });
    };

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(getDisplayedBasemapLabel).toBe('Carto Light');

    await basemapSelector.selectOption({ label: 'OpenStreetMap' });

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('OpenStreetMap');
    await expect.poll(() => getActiveBaseLayerTitle(page)).not.toBe('Carto Light');
    await expect.poll(getDisplayedBasemapLabel).toBe('OpenStreetMap');
    await expect.poll(getDisplayedBasemapLabel).not.toBe('Carto Light');
});
