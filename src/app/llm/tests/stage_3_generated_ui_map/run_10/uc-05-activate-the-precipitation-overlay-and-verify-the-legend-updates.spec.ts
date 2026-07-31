// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../map-model-helpers';

test('Use Case 5: Activate the Precipitation overlay and verify the legend updates', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Wait for the map and initial layers to settle
    await expect(page.getByTestId('map-container')).toBeVisible();
    await expect(page.getByTestId('layer-switcher')).toBeVisible();
    await expect(page.getByTestId('legend')).toBeVisible();

    // Step 1: Click the visibility toggle of the Precipitation overlay layer
    // The Precipitation layer is initially hidden (visible by default: false)
    // We click the checkbox associated with the Precipitation layer in the layer switcher
    const precipitationToggle = page.getByRole('checkbox', { name: 'Precipitation' });
    await precipitationToggle.click({ force: true });

    // Step 2: Verify the Precipitation overlay layer toggle is in the enabled (checked) state
    await expect(precipitationToggle).toBeChecked();

    // Verify the layer is actually rendered on the map via the map model helper
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

    // Step 3: Verify the legend displays an entry corresponding to the Precipitation layer
    // The legend element for precipitation is expected to be visible
    await expect(page.getByTestId('precipitation-legend')).toBeVisible();
});
