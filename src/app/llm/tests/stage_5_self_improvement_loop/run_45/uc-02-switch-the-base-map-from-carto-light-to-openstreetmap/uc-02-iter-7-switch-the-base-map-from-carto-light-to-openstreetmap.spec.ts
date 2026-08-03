// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle } from '../../../../map-model-helpers';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    await expect(page.getByRole('application', { name: 'webgis map', exact: true })).toBeVisible();

    const layerSwitcher = page.getByTestId('layer-switcher');
    const layerSwitcherToggle = page.getByTestId('layer-switcher-toggle');

    await expect(layerSwitcherToggle).toBeVisible();

    if (!(await layerSwitcher.isVisible())) {
        await expect(layerSwitcherToggle).toHaveAttribute('aria-pressed', 'false');
        await layerSwitcherToggle.click();
    }

    await expect(layerSwitcher).toBeVisible();

    const basemapCombobox = layerSwitcher.getByRole('combobox', { name: 'Basemaps', exact: true });
    await expect(basemapCombobox).toBeVisible();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect(basemapCombobox).toContainText('Carto Light');

    await basemapCombobox.click();

    const basemapListbox = page.getByRole('listbox');
    await expect(basemapListbox).toBeVisible();

    const openStreetMapOption = basemapListbox.getByRole('option', {
        name: 'OpenStreetMap',
        exact: true
    });
    await expect(openStreetMapOption).toBeVisible();
    await openStreetMapOption.click();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('OpenStreetMap');
    await expect.poll(() => getActiveBaseLayerTitle(page)).not.toBe('Carto Light');
    await expect(basemapCombobox).toContainText('OpenStreetMap');
    await expect(basemapCombobox).not.toContainText('Carto Light');
});
