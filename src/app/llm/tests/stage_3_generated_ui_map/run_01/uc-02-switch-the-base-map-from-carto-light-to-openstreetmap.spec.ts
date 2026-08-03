// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle } from '../../../map-model-helpers';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    await expect(page.getByTestId('map-container')).toBeVisible();
    await expect(page.getByTestId('layer-switcher')).toBeVisible();
    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');

    const layerSwitcher = page.getByTestId('layer-switcher');

    const baseMapSelectorButtonCandidates = [
        layerSwitcher.getByRole('button', { name: 'Base map', exact: true }),
        layerSwitcher.getByRole('button', { name: 'Base maps', exact: true }),
        layerSwitcher.getByRole('button', { name: 'Basemaps', exact: true }),
        layerSwitcher.getByRole('button', { name: 'Base layer', exact: true }),
        layerSwitcher.getByRole('button', { name: 'Base layers', exact: true }),
        layerSwitcher.getByRole('button', { name: 'Background map', exact: true }),
        layerSwitcher.getByRole('button', { name: 'Background maps', exact: true })
    ];

    for (const candidate of baseMapSelectorButtonCandidates) {
        if ((await candidate.count()) > 0) {
            const selectorButton = candidate.first();
            const expanded = await selectorButton.getAttribute('aria-expanded');
            if (expanded === 'false') {
                await selectorButton.click();
            }
            break;
        }
    }

    const cartoLightRadio = layerSwitcher.getByRole('radio', { name: 'Carto Light', exact: true });
    const openStreetMapRadio = layerSwitcher.getByRole('radio', { name: 'OpenStreetMap', exact: true });

    await expect(cartoLightRadio).toBeAttached();
    await expect(openStreetMapRadio).toBeAttached();
    await expect(cartoLightRadio).toBeChecked();

    await openStreetMapRadio.click({ force: true });

    await expect(openStreetMapRadio).toBeChecked();
    await expect(cartoLightRadio).not.toBeChecked();
    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('OpenStreetMap');
});
