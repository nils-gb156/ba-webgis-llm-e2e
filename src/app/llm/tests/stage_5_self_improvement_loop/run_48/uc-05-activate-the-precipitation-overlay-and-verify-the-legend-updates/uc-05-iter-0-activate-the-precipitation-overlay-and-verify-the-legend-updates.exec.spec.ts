// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 5: Activate the Precipitation overlay and verify the legend updates', async ({
    page,
}) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Wait for the map and layer switcher to be fully loaded and interactive
    await expect(page.getByTestId('layer-switcher-toggle')).toBeVisible();
    await expect(page.getByTestId('layer-switcher')).toBeVisible();

    // Step 1: Click the visibility toggle of the Precipitation overlay layer to show it.
    // The layer is initially unchecked. Chakra UI checkboxes require force: true.
    const precipitationCheckbox = page
        .getByRole('checkbox', { name: 'Precipitation' })
        .first();
    await expect(precipitationCheckbox).not.toBeChecked();
    await precipitationCheckbox.click({ force: true });

    // Expected result: The Precipitation overlay layer toggle is in the enabled (checked) state.
    await expect(precipitationCheckbox).toBeChecked();

    // Verify the layer is actually rendered on the map
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

    // Step 2: The user views the legend.
    // Expected result: The legend displays an entry corresponding to the Precipitation layer.
    await expect(page.getByRole('heading', { name: 'Precipitation' })).toBeVisible();
});
