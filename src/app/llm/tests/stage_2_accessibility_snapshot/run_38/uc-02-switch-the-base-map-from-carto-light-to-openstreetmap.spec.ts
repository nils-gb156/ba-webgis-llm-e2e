// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const layerSwitcher = page.getByTestId('layer-switcher');
    await expect(layerSwitcher).toBeVisible();

    const basemapSelect = layerSwitcher.getByRole('combobox', { name: 'Basemaps', exact: true });
    await expect(basemapSelect).toBeVisible();

    const getSelectedBasemapLabel = async () =>
        await basemapSelect.evaluate((element) => {
            const select = element as HTMLSelectElement;
            return select.selectedOptions.item(0)?.textContent?.trim();
        });

    await expect.poll(getSelectedBasemapLabel).toBe('Carto Light');

    await basemapSelect.click();
    await basemapSelect.selectOption({ label: 'OpenStreetMap' });

    await expect.poll(getSelectedBasemapLabel).toBe('OpenStreetMap');
    await expect.poll(getSelectedBasemapLabel).not.toBe('Carto Light');
});
