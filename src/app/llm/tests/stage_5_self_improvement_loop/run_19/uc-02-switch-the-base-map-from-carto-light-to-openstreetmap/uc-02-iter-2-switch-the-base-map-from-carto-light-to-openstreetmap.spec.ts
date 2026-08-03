// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle } from '../../../../map-model-helpers';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const layerSwitcher = page.getByTestId('layer-switcher');
    const layerSwitcherToggle = page.getByTestId('layer-switcher-toggle');
    const basemapSelect = layerSwitcher.getByRole('combobox', { name: 'Basemaps', exact: true });

    const getDisplayedBasemap = async (): Promise<string | null> =>
        await basemapSelect.evaluate((element) => {
            if (element instanceof HTMLSelectElement) {
                const selectedOption = Array.from(element.options).find((option) => option.selected);
                return selectedOption?.textContent?.trim() ?? null;
            }

            if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
                return element.value.trim();
            }

            const maybeValue = (element as HTMLElement & { value?: unknown }).value;
            if (typeof maybeValue === 'string' && maybeValue.trim().length > 0) {
                return maybeValue.trim();
            }

            const ariaValueText = element.getAttribute('aria-valuetext');
            if (ariaValueText && ariaValueText.trim().length > 0) {
                return ariaValueText.trim();
            }

            const text = element.textContent?.trim();
            return text && text.length > 0 ? text : null;
        });

    await expect(layerSwitcherToggle).toBeVisible();
    if (!(await layerSwitcher.isVisible())) {
        if ((await layerSwitcherToggle.getAttribute('aria-pressed')) !== 'true') {
            await layerSwitcherToggle.click();
        }
    }

    await expect(layerSwitcher).toBeVisible();
    await expect(basemapSelect).toBeVisible();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(() => getDisplayedBasemap()).toBe('Carto Light');

    await basemapSelect.selectOption({ label: 'OpenStreetMap' });

    await expect.poll(() => getDisplayedBasemap()).toBe('OpenStreetMap');
    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('OpenStreetMap');
    await expect.poll(() => getDisplayedBasemap()).not.toBe('Carto Light');
    await expect.poll(() => getActiveBaseLayerTitle(page)).not.toBe('Carto Light');
});
