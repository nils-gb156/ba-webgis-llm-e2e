// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getActiveBaseLayerTitle } from '../../../../map-model-helpers';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const layerSwitcher = page.getByTestId('layer-switcher');
    const layerSwitcherToggle = page.getByTestId('layer-switcher-toggle');
    const basemapSelect = layerSwitcher.getByRole('combobox', { name: 'Basemaps', exact: true });

    await expect(layerSwitcher).toBeVisible();
    await expect(layerSwitcherToggle).toHaveAttribute('aria-pressed', 'true');
    await expect(basemapSelect).toBeVisible();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');

    const cartoLightOption = basemapSelect.getByRole('option', { name: 'Carto Light', exact: true });
    const openStreetMapOption = basemapSelect.getByRole('option', { name: 'OpenStreetMap', exact: true });

    await expect(cartoLightOption).toHaveJSProperty('selected', true);
    await expect(openStreetMapOption).toBeVisible();

    await basemapSelect.selectOption({ label: 'OpenStreetMap' });

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('OpenStreetMap');
    await expect(openStreetMapOption).toHaveJSProperty('selected', true);
    await expect(cartoLightOption).toHaveJSProperty('selected', false);
});
