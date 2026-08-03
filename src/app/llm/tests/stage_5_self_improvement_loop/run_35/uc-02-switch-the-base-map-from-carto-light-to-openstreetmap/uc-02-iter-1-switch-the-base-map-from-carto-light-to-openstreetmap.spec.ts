// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle } from '../../../../map-model-helpers';

test('UC2 Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const layerSwitcher = page.getByTestId('layer-switcher');
    const layerSwitcherToggle = page.getByTestId('layer-switcher-toggle');
    const basemapSelect = page.getByRole('combobox', { name: 'Basemaps', exact: true });

    if (!(await layerSwitcher.isVisible())) {
        await expect(layerSwitcherToggle).toBeVisible();
        if ((await layerSwitcherToggle.getAttribute('aria-pressed')) !== 'true') {
            await layerSwitcherToggle.click();
        }
    }

    await expect(layerSwitcher).toBeVisible();
    await expect(basemapSelect).toBeVisible();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');

    await expect
        .poll(async () => {
            return await basemapSelect.evaluate((element) => {
                if (element instanceof HTMLSelectElement) {
                    return (
                        element.selectedOptions.item(0)?.textContent?.trim() ??
                        element.value.trim()
                    );
                }
                if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
                    return element.value.trim();
                }
                return (
                    element.getAttribute('aria-valuetext')?.trim() ??
                    element.textContent?.trim() ??
                    ''
                );
            });
        })
        .toBe('Carto Light');

    const basemapSelectTagName = await basemapSelect.evaluate((element) =>
        element.tagName.toLowerCase()
    );

    if (basemapSelectTagName === 'select') {
        await basemapSelect.selectOption({ label: 'OpenStreetMap' });
    } else {
        await basemapSelect.click();
        const openStreetMapOption = page.getByRole('option', {
            name: 'OpenStreetMap',
            exact: true
        });
        await expect(openStreetMapOption).toBeVisible();
        await openStreetMapOption.click();
    }

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('OpenStreetMap');
    await expect.poll(() => getActiveBaseLayerTitle(page)).not.toBe('Carto Light');

    await expect
        .poll(async () => {
            return await basemapSelect.evaluate((element) => {
                if (element instanceof HTMLSelectElement) {
                    return (
                        element.selectedOptions.item(0)?.textContent?.trim() ??
                        element.value.trim()
                    );
                }
                if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
                    return element.value.trim();
                }
                return (
                    element.getAttribute('aria-valuetext')?.trim() ??
                    element.textContent?.trim() ??
                    ''
                );
            });
        })
        .toBe('OpenStreetMap');

    await expect
        .poll(async () => {
            return await basemapSelect.evaluate((element) => {
                if (element instanceof HTMLSelectElement) {
                    return element.selectedOptions.item(0)?.textContent?.trim() === 'Carto Light';
                }
                if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
                    return element.value.trim() === 'Carto Light';
                }
                return (
                    (element.getAttribute('aria-valuetext')?.trim() ??
                        element.textContent?.trim() ??
                        '') === 'Carto Light'
                );
            });
        })
        .toBe(false);
});
