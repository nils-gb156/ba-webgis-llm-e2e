// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered, getActiveBaseLayerTitle } from '../../../map-model-helpers';

test('UC5: Activate the Precipitation overlay and verify the legend updates', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');

    const layerSwitcher = page.getByTestId('layer-switcher');
    const legend = page.getByTestId('legend');
    const layerSwitcherToggle = page.getByTestId('layer-switcher-toggle');
    const legendToggle = page.getByTestId('legend-toggle');

    if (!(await layerSwitcher.isVisible())) {
        await expect(layerSwitcherToggle).toBeVisible();
        const pressed = await layerSwitcherToggle.getAttribute('aria-pressed');
        if (pressed !== 'true') {
            await layerSwitcherToggle.click();
        }
    }
    await expect(layerSwitcher).toBeVisible();

    if (!(await legend.isVisible())) {
        await expect(legendToggle).toBeVisible();
        const pressed = await legendToggle.getAttribute('aria-pressed');
        if (pressed !== 'true') {
            await legendToggle.click();
        }
    }
    await expect(legend).toBeVisible();

    const precipitationToggle = layerSwitcher.getByRole('checkbox', {
        name: 'Precipitation',
        exact: true
    });

    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(false);
    await expect(precipitationToggle).not.toBeChecked();

    await precipitationToggle.click({ force: true });

    await expect(precipitationToggle).toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

    await expect(legend).toContainText('Precipitation');
});
