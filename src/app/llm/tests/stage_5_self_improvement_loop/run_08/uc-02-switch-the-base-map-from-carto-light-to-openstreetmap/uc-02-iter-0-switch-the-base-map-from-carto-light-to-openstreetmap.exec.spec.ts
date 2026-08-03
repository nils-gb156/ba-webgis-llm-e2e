// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getActiveBaseLayerTitle } from '../../../../map-model-helpers';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const layerSwitcher = page.getByTestId('layer-switcher');
    const layerSwitcherToggle = page.getByTestId('layer-switcher-toggle');
    const basemapSelector = page.getByRole('combobox', { name: 'Basemaps', exact: true });

    await expect(layerSwitcher).toBeVisible();
    await expect(layerSwitcherToggle).toHaveAttribute('aria-pressed', 'true');
    await expect(basemapSelector).toBeVisible();

    const getSelectedBasemapLabel = async () =>
        await basemapSelector.evaluate((element) => {
            const select = element as HTMLSelectElement;
            const selectedOption = select.selectedOptions[0];
            return selectedOption?.label ?? selectedOption?.textContent?.trim() ?? undefined;
        });

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(() => getSelectedBasemapLabel()).toBe('Carto Light');

    await basemapSelector.click();
    await basemapSelector.selectOption({ label: 'OpenStreetMap' });

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('OpenStreetMap');
    await expect.poll(() => getSelectedBasemapLabel()).toBe('OpenStreetMap');
    await expect.poll(() => getSelectedBasemapLabel()).not.toBe('Carto Light');
});
