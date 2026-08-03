// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 5: Activate the Precipitation overlay and verify the legend updates', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    await expect(page.getByRole('application', { name: 'webgis map' })).toBeVisible();

    const layerSwitcher = page.getByTestId('layer-switcher');
    const legend = page.getByTestId('legend');
    const precipitationToggle = layerSwitcher.getByRole('checkbox', {
        name: 'Precipitation',
        exact: true
    });

    await expect(layerSwitcher).toBeVisible();
    await expect(legend).toBeVisible();

    await expect(precipitationToggle).not.toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(false);
    await expect(legend.getByText(/^Precipitation\b/i)).toHaveCount(0);

    await precipitationToggle.click({ force: true });

    await expect(precipitationToggle).toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);
    await expect(legend.getByText(/^Precipitation\b/i)).toBeVisible();
});
