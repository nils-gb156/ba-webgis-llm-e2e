// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getActiveBaseLayerTitle, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 5: Activate the Precipitation overlay and verify the legend updates', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');

    const layerSwitcher = page.getByTestId('layer-switcher');
    const layerSwitcherToggle = page.getByTestId('layer-switcher-toggle');
    if (!(await layerSwitcher.isVisible())) {
        await expect(layerSwitcherToggle).toHaveAttribute('aria-pressed', 'false');
        await layerSwitcherToggle.click();
    }
    await expect(layerSwitcher).toBeVisible();

    const legend = page.getByTestId('legend');
    const legendToggle = page.getByTestId('legend-toggle');
    if (!(await legend.isVisible())) {
        await expect(legendToggle).toHaveAttribute('aria-pressed', 'false');
        await legendToggle.click();
    }
    await expect(legend).toBeVisible();

    const precipitationCheckbox = layerSwitcher.getByRole('checkbox', {
        name: 'Precipitation',
        exact: true
    });

    await expect(precipitationCheckbox).not.toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(false);
    await expect(legend).not.toContainText(/Precipitation/i);

    await precipitationCheckbox.click({ force: true });

    await expect(precipitationCheckbox).toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);
    await expect(legend).toContainText(/Precipitation/i);
});
