// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle } from '../../../map-model-helpers';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const layerSwitcher = page.getByTestId('layer-switcher');
    await expect(layerSwitcher).toBeVisible();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');

    const openStreetMapLabel = layerSwitcher.getByText('OpenStreetMap', { exact: true });
    const cartoLightLabel = layerSwitcher.getByText('Carto Light', { exact: true });
    const baseMapSelectorToggle = layerSwitcher
        .getByRole('button', { name: /base maps?|basemaps?/i })
        .first();

    if (!(await openStreetMapLabel.isVisible()) && (await baseMapSelectorToggle.count()) > 0) {
        await baseMapSelectorToggle.click();
    }

    await expect(openStreetMapLabel).toBeVisible();
    await expect(cartoLightLabel).toBeVisible();

    const openStreetMapRadio = layerSwitcher.getByRole('radio', {
        name: 'OpenStreetMap',
        exact: true
    });
    const cartoLightRadio = layerSwitcher.getByRole('radio', {
        name: 'Carto Light',
        exact: true
    });

    await openStreetMapRadio.click({ force: true });

    await expect(openStreetMapRadio).toBeChecked();
    await expect(cartoLightRadio).not.toBeChecked();
    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('OpenStreetMap');
});
