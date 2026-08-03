// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle } from "../../../map-model-helpers";

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const layerSwitcher = page.getByTestId('layer-switcher');
    await expect(layerSwitcher).toBeVisible();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');

    const openStreetMapRadio = layerSwitcher.getByRole('radio', {
        name: 'OpenStreetMap',
        exact: true
    });
    const cartoLightRadio = layerSwitcher.getByRole('radio', {
        name: 'Carto Light',
        exact: true
    });
    const openStreetMapMenuItem = layerSwitcher.getByRole('menuitemradio', {
        name: 'OpenStreetMap',
        exact: true
    });
    const cartoLightMenuItem = layerSwitcher.getByRole('menuitemradio', {
        name: 'Carto Light',
        exact: true
    });

    if (
        !(await openStreetMapRadio.isVisible()) &&
        !(await openStreetMapMenuItem.isVisible())
    ) {
        const baseMapSelectorCandidates = [
            layerSwitcher.getByRole('button', { name: /base map/i }),
            layerSwitcher.getByRole('button', { name: /basemap/i }),
            layerSwitcher.getByRole('button', { name: /background/i }),
            layerSwitcher.getByRole('button', { name: 'Carto Light', exact: true })
        ];

        for (const candidate of baseMapSelectorCandidates) {
            if ((await candidate.count()) > 0 && (await candidate.first().isVisible())) {
                await candidate.first().click();
                break;
            }
        }
    }

    if (await openStreetMapRadio.isVisible()) {
        await expect(cartoLightRadio).toBeChecked();
        await openStreetMapRadio.click({ force: true });
        await expect(openStreetMapRadio).toBeChecked();
        await expect(cartoLightRadio).not.toBeChecked();
    } else if (await openStreetMapMenuItem.isVisible()) {
        if (await cartoLightMenuItem.isVisible()) {
            await expect(cartoLightMenuItem).toHaveAttribute('aria-checked', 'true');
        }
        await openStreetMapMenuItem.click();
        await expect(openStreetMapMenuItem).toHaveAttribute('aria-checked', 'true');
        if (await cartoLightMenuItem.isVisible()) {
            await expect(cartoLightMenuItem).toHaveAttribute('aria-checked', 'false');
        }
    } else {
        const openStreetMapButton = layerSwitcher.getByRole('button', {
            name: 'OpenStreetMap',
            exact: true
        });
        await expect(openStreetMapButton).toBeVisible();
        await openStreetMapButton.click();
    }

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('OpenStreetMap');
    await expect.poll(async () => (await getActiveBaseLayerTitle(page)) !== 'Carto Light').toBe(true);
});
