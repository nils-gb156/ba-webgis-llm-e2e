// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle } from '../../../map-model-helpers';

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

    if (!(await openStreetMapRadio.isVisible())) {
        const baseMapToggle = layerSwitcher.getByRole('button', { name: /base maps?/i });
        if ((await baseMapToggle.count()) > 0) {
            const toggle = baseMapToggle.first();
            await expect(toggle).toBeVisible();
            if ((await toggle.getAttribute('aria-expanded')) !== 'true') {
                await toggle.click();
            }
        }
    }

    await expect(openStreetMapRadio).toBeVisible();
    await expect(cartoLightRadio).toBeVisible();
    await expect(cartoLightRadio).toBeChecked();

    await openStreetMapRadio.click({ force: true });

    await expect(openStreetMapRadio).toBeChecked();
    await expect(cartoLightRadio).not.toBeChecked();
    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('OpenStreetMap');
    await expect.poll(async () => (await getActiveBaseLayerTitle(page)) === 'Carto Light').toBe(false);
});
