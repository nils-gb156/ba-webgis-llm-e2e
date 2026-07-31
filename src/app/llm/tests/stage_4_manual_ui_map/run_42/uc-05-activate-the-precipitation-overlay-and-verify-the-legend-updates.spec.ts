// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../map-model-helpers';

test('Use Case 5: Activate the Precipitation overlay and verify the legend updates', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Wait for the map and initial UI to be ready
    await expect(page.getByTestId('map-container')).toBeVisible();
    await expect(page.getByTestId('layer-switcher')).toBeVisible();
    await expect(page.getByTestId('legend')).toBeVisible();

    // Step 1: Click the visibility toggle of the Precipitation overlay layer
    // The layer switcher contains checkboxes for operational layers.
    // We use force: true because Chakra UI renders the input hidden behind a decorative control.
    const precipitationToggle = page.getByRole('checkbox', { name: 'Precipitation' });
    await expect(precipitationToggle).toBeChecked({ checked: false });
    await precipitationToggle.click({ force: true });

    // Verify the toggle is now checked
    await expect(precipitationToggle).toBeChecked({ checked: true });

    // Verify the layer is actually rendered on the map via the map model helper
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

    // Step 2: View the legend and verify it displays an entry for the Precipitation layer
    // The legend component should update to show the active layer's legend.
    // We assert that the legend container is visible and contains text related to "Precipitation".
    const legend = page.getByTestId('legend');
    await expect(legend).toBeVisible();
    
    // The legend entry might be a specific element or just text within the legend.
    // Using getByText is appropriate here as the legend content is DOM-based text.
    await expect(legend.getByText(/Precipitation/i)).toBeVisible();
});
