// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../map-model-helpers';

test('Use Case 5: Activate the Precipitation overlay and verify the legend updates', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Wait for the map and initial layers to settle
    await expect(page.getByTestId('layer-switcher')).toBeVisible();
    await expect(page.getByTestId('legend')).toBeVisible();
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);

    // Step 1: Click the visibility toggle of the Precipitation overlay layer.
    // The layer switcher is visible by default. We locate the Precipitation layer entry
    // within the layer switcher and click its checkbox.
    const precipitationLayerContainer = page.getByRole('treeitem', { name: 'Precipitation' });
    await expect(precipitationLayerContainer).toBeVisible();
    
    // Use force: true because Chakra UI checkboxes render the real input visually hidden
    await precipitationLayerContainer.getByRole('checkbox').click({ force: true });

    // Verify the toggle is now in the enabled (checked) state
    await expect(precipitationLayerContainer.getByRole('checkbox')).toBeChecked();

    // Verify the layer is actually rendered on the map via the helper
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

    // Step 2: View the legend and verify it displays an entry for the Precipitation layer.
    await expect(page.getByTestId('legend')).toBeVisible();
    
    // The legend should now contain an entry related to Precipitation.
    // We look for text containing "Precipitation" within the legend element.
    await expect(page.getByTestId('legend').getByText(/Precipitation/i)).toBeVisible();
});
