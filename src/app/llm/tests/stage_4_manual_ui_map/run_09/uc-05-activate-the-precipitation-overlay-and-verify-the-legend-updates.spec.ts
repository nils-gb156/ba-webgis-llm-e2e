// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../map-model-helpers';

test('Use Case 5: Activate the Precipitation overlay and verify the legend updates', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Step 1: The user clicks the visibility toggle of the Precipitation overlay layer to show it.
    // The Precipitation layer is not in the defaults, so it should be unchecked initially.
    const precipitationCheckbox = page.getByRole('checkbox', { name: 'Precipitation' });
    await expect(precipitationCheckbox).toBeChecked({ checked: false });

    // Use force: true because Chakra UI checkbox control intercepts pointer events
    await precipitationCheckbox.click({ force: true });

    // Verify the checkbox state changed
    await expect(precipitationCheckbox).toBeChecked();

    // Verify the layer is actually rendered on the map via the map model helper
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

    // Step 2: The user views the legend.
    // Expected results: The legend displays an entry corresponding to the Precipitation layer.
    const legend = page.getByTestId('legend');
    await expect(legend).toBeVisible();

    // Check that the legend contains an entry for Precipitation
    // The legend component typically lists the titles of active layers
    await expect(legend.getByText('Precipitation')).toBeVisible();
});
