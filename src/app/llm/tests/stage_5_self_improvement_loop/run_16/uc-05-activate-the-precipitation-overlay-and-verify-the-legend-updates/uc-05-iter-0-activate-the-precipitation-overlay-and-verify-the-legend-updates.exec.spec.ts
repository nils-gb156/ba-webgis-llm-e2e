// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getActiveBaseLayerTitle, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 5: Activate the Precipitation overlay and verify the legend updates', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const layerSwitcher = page.getByTestId('layer-switcher');
    const legend = page.getByTestId('legend');

    await expect(layerSwitcher).toBeVisible();
    await expect(legend).toBeVisible();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');

    const precipitationCheckbox = layerSwitcher.getByRole('checkbox', {
        name: 'Precipitation',
        exact: true
    });

    await expect(precipitationCheckbox).not.toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(false);

    await precipitationCheckbox.click({ force: true });

    await expect(precipitationCheckbox).toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

    const precipitationLegendHeading = legend.getByRole('heading', { name: /Precipitation/i });
    const precipitationLegendImage = legend.getByRole('img', { name: /Precipitation/i });
    const precipitationLegendText = legend.getByText(/Precipitation/i);

    await expect.poll(async () => {
        if (await precipitationLegendHeading.count()) {
            return await precipitationLegendHeading.first().isVisible();
        }
        if (await precipitationLegendImage.count()) {
            return await precipitationLegendImage.first().isVisible();
        }
        if (await precipitationLegendText.count()) {
            return await precipitationLegendText.first().isVisible();
        }
        return false;
    }).toBe(true);
});
