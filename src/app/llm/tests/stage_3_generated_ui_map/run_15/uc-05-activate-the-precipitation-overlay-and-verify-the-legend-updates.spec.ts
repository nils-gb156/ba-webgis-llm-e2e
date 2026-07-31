// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../map-model-helpers';

test('Use Case 5: Activate the Precipitation overlay and verify the legend updates', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Wait for the map to be ready and initial layers to settle
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);

    // Step 1: Click the visibility toggle of the Precipitation overlay layer
    // The layer switcher is visible by default. We look for the checkbox associated with "Precipitation".
    const precipitationToggle = page.getByRole('checkbox', { name: 'Precipitation' });
    await precipitationToggle.click({ force: true });

    // Step 2: Verify the toggle is in the enabled (checked) state
    await expect(precipitationToggle).toBeChecked();

    // Step 3: Verify the layer is actually rendered on the map
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

    // Step 4: Verify the legend displays an entry corresponding to the Precipitation layer
    // Based on the UI map, there is a specific legend element for precipitation
    const precipitationLegend = page.getByTestId('precipitation-legend');
    await expect(precipitationLegend).toBeVisible();
});
