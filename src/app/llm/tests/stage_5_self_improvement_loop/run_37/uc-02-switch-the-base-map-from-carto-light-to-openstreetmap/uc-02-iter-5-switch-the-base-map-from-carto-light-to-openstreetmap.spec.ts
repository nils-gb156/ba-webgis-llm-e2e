// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle } from '../../../../map-model-helpers';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const layerSwitcherToggle = page.getByTestId('layer-switcher-toggle');
    const layerSwitcherPanel = page.getByTestId('layer-switcher');
    const basemapSelector = page.getByRole('combobox', { name: 'Basemaps', exact: true });

    await expect(layerSwitcherToggle).toBeVisible();

    if ((await layerSwitcherToggle.getAttribute('aria-pressed')) !== 'true') {
        await layerSwitcherToggle.click();
    }

    await expect(layerSwitcherToggle).toHaveAttribute('aria-pressed', 'true');
    await expect(layerSwitcherPanel).toBeVisible();
    await expect(basemapSelector).toBeVisible();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(() =>
        basemapSelector.evaluate((element) => {
            if (element instanceof HTMLSelectElement) {
                return (
                    element.selectedOptions.item(0)?.label ||
                    element.selectedOptions.item(0)?.textContent?.trim() ||
                    ''
                );
            }
            if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
                return element.value;
            }
            return (
                element.getAttribute('aria-valuetext') ||
                element.getAttribute('value') ||
                element.textContent?.trim() ||
                ''
            );
        })
    ).toBe('Carto Light');

    await basemapSelector.selectOption({ label: 'OpenStreetMap' });

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('OpenStreetMap');
    await expect.poll(() =>
        basemapSelector.evaluate((element) => {
            if (element instanceof HTMLSelectElement) {
                return (
                    element.selectedOptions.item(0)?.label ||
                    element.selectedOptions.item(0)?.textContent?.trim() ||
                    ''
                );
            }
            if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
                return element.value;
            }
            return (
                element.getAttribute('aria-valuetext') ||
                element.getAttribute('value') ||
                element.textContent?.trim() ||
                ''
            );
        })
    ).toBe('OpenStreetMap');
});
