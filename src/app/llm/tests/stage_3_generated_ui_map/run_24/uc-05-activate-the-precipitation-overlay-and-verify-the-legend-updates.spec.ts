// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../map-model-helpers';

test('Use Case 5: Activate the Precipitation overlay and verify the legend updates', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Wait for the map and initial layers to load
    await expect(page.getByTestId('layer-switcher')).toBeVisible();
    await expect(page.getByTestId('legend')).toBeVisible();

    // Wait for the Precipitation layer to be initially hidden (precondition check)
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(false);

    // Step 1: Click the visibility toggle of the Precipitation overlay layer
    // The layer switcher is visible by default. We locate the checkbox for "Precipitation".
    // Using force: true because Chakra UI checkboxes have hidden inputs.
    const precipitationToggle = page.getByRole('checkbox', { name: 'Precipitation' });
    await precipitationToggle.click({ force: true });

    // Verify the toggle is now checked
    await expect(precipitationToggle).toBeChecked();

    // Verify the layer is actually rendered on the map
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

    // Step 2: View the legend
    // Wait for the legend to update and contain the Precipitation entry
    // The legend might re-render, so we poll for the specific legend item
    const precipitationLegend = page.getByText('Precipitation', { exact: true });
    await expect(precipitationLegend).toBeVisible();
});
