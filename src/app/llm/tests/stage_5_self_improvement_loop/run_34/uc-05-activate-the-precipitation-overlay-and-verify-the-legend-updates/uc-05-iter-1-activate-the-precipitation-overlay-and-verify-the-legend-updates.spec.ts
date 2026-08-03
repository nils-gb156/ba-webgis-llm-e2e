// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 5: Activate the Precipitation overlay and verify the legend updates', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const layerSwitcherToggle = page.getByTestId('layer-switcher-toggle');
    const layerSwitcher = page.getByTestId('layer-switcher');
    const legendToggle = page.getByTestId('legend-toggle');
    const legend = page.getByTestId('legend');

    await expect(layerSwitcherToggle).toBeVisible();
    if ((await layerSwitcherToggle.getAttribute('aria-pressed')) !== 'true') {
        await layerSwitcherToggle.click();
    }
    await expect(layerSwitcherToggle).toHaveAttribute('aria-pressed', 'true');
    await expect(layerSwitcher).toBeVisible();

    await expect(legendToggle).toBeVisible();
    if ((await legendToggle.getAttribute('aria-pressed')) !== 'true') {
        await legendToggle.click();
    }
    await expect(legendToggle).toHaveAttribute('aria-pressed', 'true');
    await expect(legend).toBeVisible();

    const precipitationCheckbox = layerSwitcher.getByRole('checkbox', {
        name: 'Precipitation',
        exact: true
    });

    await expect(precipitationCheckbox).toBeVisible();
    await expect(precipitationCheckbox).not.toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(false);
    await expect(legend).not.toContainText('Precipitation');

    await precipitationCheckbox.click({ force: true });

    await expect(precipitationCheckbox).toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);
    await expect(legend).toContainText('Precipitation');
});
