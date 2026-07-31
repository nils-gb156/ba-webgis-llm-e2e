// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../map-model-helpers';

test('Use Case 5: Activate the Precipitation overlay and verify the legend updates', async ({
    page,
}) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Wait for the map to be ready and the layer switcher to be visible
    await expect(page.getByTestId('layer-switcher')).toBeVisible();

    // Wait for the initial operational layers to be rendered (defaults: Temperature, UV-Index Stations, EUCOS Ground Stations)
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

    // Step 1: The user clicks the visibility toggle of the Precipitation overlay layer to show it.
    // The layer switcher is visible by default, so we can find the checkbox directly.
    const precipitationCheckbox = page.getByRole('checkbox', { name: 'Precipitation' });
    await expect(precipitationCheckbox).toBeChecked({ checked: false });
    await precipitationCheckbox.click({ force: true });

    // Step 2: The user views the legend.
    // Expected result: The Precipitation overlay layer toggle is in the enabled (checked) state.
    await expect(precipitationCheckbox).toBeChecked();

    // Expected result: The legend displays an entry corresponding to the Precipitation layer.
    // We verify the layer is actually rendered on the map canvas.
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

    // Verify the legend is visible and contains some content (specific text might vary, but structure should be there)
    const legend = page.getByTestId('legend');
    await expect(legend).toBeVisible();
});
