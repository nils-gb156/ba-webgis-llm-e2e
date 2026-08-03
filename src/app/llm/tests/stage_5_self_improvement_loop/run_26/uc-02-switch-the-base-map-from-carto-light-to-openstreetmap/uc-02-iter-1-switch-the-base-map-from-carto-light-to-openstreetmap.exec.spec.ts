// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getActiveBaseLayerTitle } from '../../../../map-model-helpers';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const layerSwitcher = page.getByTestId('layer-switcher');
    const basemapSelect = layerSwitcher.getByRole('combobox', { name: 'Basemaps', exact: true });

    await expect(layerSwitcher).toBeVisible();
    await expect(basemapSelect).toBeVisible();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');

    await expect
        .poll(async () =>
            basemapSelect.evaluate((element) => {
                if (element instanceof HTMLSelectElement) {
                    return element.selectedOptions.item(0)?.label ?? '';
                }
                if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
                    return element.value;
                }
                return (
                    element.getAttribute('aria-valuetext') ??
                    element.getAttribute('value') ??
                    element.textContent ??
                    ''
                ).trim();
            })
        )
        .toBe('Carto Light');

    const tagName = await basemapSelect.evaluate((element) => element.tagName);

    if (tagName === 'SELECT') {
        await basemapSelect.selectOption({ label: 'OpenStreetMap' });
    } else {
        await basemapSelect.click();
        await page.getByRole('option', { name: 'OpenStreetMap', exact: true }).click();
    }

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('OpenStreetMap');
    await expect.poll(() => getActiveBaseLayerTitle(page)).not.toBe('Carto Light');

    await expect
        .poll(async () =>
            basemapSelect.evaluate((element) => {
                if (element instanceof HTMLSelectElement) {
                    return element.selectedOptions.item(0)?.label ?? '';
                }
                if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
                    return element.value;
                }
                return (
                    element.getAttribute('aria-valuetext') ??
                    element.getAttribute('value') ??
                    element.textContent ??
                    ''
                ).trim();
            })
        )
        .toBe('OpenStreetMap');
});
