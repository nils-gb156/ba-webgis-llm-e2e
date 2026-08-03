// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle } from '../../../../map-model-helpers';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const layerSwitcher = page.getByTestId('layer-switcher');
    const basemapSelector = page.getByRole('combobox', { name: 'Basemaps', exact: true });

    await expect(layerSwitcher).toBeVisible();
    await expect(basemapSelector).toBeVisible();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect(basemapSelector).toContainText('Carto Light');

    await basemapSelector.click();

    const openStreetMapOption = page.getByRole('option', { name: 'OpenStreetMap', exact: true });
    await expect(openStreetMapOption).toBeVisible();
    await openStreetMapOption.click();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('OpenStreetMap');
    await expect(basemapSelector).toContainText('OpenStreetMap');
    await expect(basemapSelector).not.toContainText('Carto Light');
});
