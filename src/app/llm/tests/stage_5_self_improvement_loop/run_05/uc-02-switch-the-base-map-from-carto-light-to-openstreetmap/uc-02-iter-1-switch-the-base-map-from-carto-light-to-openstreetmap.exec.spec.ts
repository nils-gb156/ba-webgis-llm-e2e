// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getActiveBaseLayerTitle } from '../../../../map-model-helpers';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const layerSwitcher = page.getByTestId('layer-switcher');
    const layerSwitcherToggle = page.getByTestId('layer-switcher-toggle');

    await expect(layerSwitcherToggle).toBeVisible();

    const layerSwitcherVisible = await layerSwitcher.isVisible();
    const layerSwitcherPressed = await layerSwitcherToggle.getAttribute('aria-pressed');

    if (!layerSwitcherVisible && layerSwitcherPressed !== 'true') {
        await layerSwitcherToggle.click();
    }

    await expect(layerSwitcher).toBeVisible();
    await expect(layerSwitcherToggle).toHaveAttribute('aria-pressed', 'true');

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');

    const basemapSelector = layerSwitcher.getByRole('combobox', { name: 'Basemaps', exact: true });
    await expect(basemapSelector).toBeVisible();

    await expect
        .poll(() =>
            basemapSelector.evaluate((element) => {
                const select = element as HTMLSelectElement;
                return select.selectedOptions[0]?.textContent?.trim();
            })
        )
        .toBe('Carto Light');

    await basemapSelector.selectOption({ label: 'OpenStreetMap' });

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('OpenStreetMap');
    await expect.poll(() => getActiveBaseLayerTitle(page)).not.toBe('Carto Light');

    await expect
        .poll(() =>
            basemapSelector.evaluate((element) => {
                const select = element as HTMLSelectElement;
                return select.selectedOptions[0]?.textContent?.trim();
            })
        )
        .toBe('OpenStreetMap');

    await expect
        .poll(() =>
            basemapSelector.evaluate((element) => {
                const select = element as HTMLSelectElement;
                return select.selectedOptions[0]?.textContent?.trim();
            })
        )
        .not.toBe('Carto Light');
});
