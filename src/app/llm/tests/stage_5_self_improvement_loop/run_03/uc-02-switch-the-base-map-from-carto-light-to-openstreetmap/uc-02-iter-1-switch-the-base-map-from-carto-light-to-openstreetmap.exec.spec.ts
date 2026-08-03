// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getActiveBaseLayerTitle } from '../../../../map-model-helpers';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const layerSwitcher = page.getByTestId('layer-switcher');
    const layerSwitcherToggle = page.getByTestId('layer-switcher-toggle');
    const basemapCombobox = page.getByRole('combobox', { name: 'Basemaps', exact: true });

    await expect(layerSwitcherToggle).toBeVisible();
    if ((await layerSwitcherToggle.getAttribute('aria-pressed')) !== 'true') {
        await layerSwitcherToggle.click();
    }

    await expect(layerSwitcher).toBeVisible();
    await expect(basemapCombobox).toBeVisible();
    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect(basemapCombobox).toContainText('Carto Light');

    await basemapCombobox.click();

    const listbox = page.getByRole('listbox');
    const cartoLightOption = page.getByRole('option', { name: 'Carto Light', exact: true });
    const openStreetMapOption = page.getByRole('option', { name: 'OpenStreetMap', exact: true });

    await expect(listbox).toBeVisible();
    await expect(cartoLightOption).toBeVisible();
    await expect(openStreetMapOption).toBeVisible();

    await openStreetMapOption.click();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('OpenStreetMap');
    await expect.poll(() => getActiveBaseLayerTitle(page)).not.toBe('Carto Light');
    await expect(basemapCombobox).toContainText('OpenStreetMap');
    await expect(basemapCombobox).not.toContainText('Carto Light');

    await basemapCombobox.click();
    await expect(listbox).toBeVisible();
    await expect(page.getByRole('option', { name: 'OpenStreetMap', exact: true })).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('option', { name: 'Carto Light', exact: true })).not.toHaveAttribute('aria-selected', 'true');
});
