// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../map-model-helpers';

test('Use Case 5: Activate the Precipitation overlay and verify the legend updates', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Wait for the map to be ready and initial layers to render
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);

    // Step 1: The user clicks the visibility toggle of the Precipitation overlay layer to show it.
    // The layer switcher is visible by default. We need to find the Precipitation layer item.
    // Based on the UI map, we have a layer-switcher panel. We'll look for the layer item by text.
    // Note: Chakra UI checkboxes need force: true.
    const layerSwitcher = page.getByRole('panel', { name: 'Layer Switcher' });
    const precipitationLayerItem = layerSwitcher.getByText('Precipitation', { exact: true }).first();
    
    // The checkbox is likely the input associated with the label or the control itself.
    // We look for the checkbox role within the layer item or the switcher.
    // Since we don't have a specific testid for the layer toggle, we use getByRole with name.
    // The name of the checkbox should be "Precipitation".
    const precipitationToggle = layerSwitcher.getByRole('checkbox', { name: 'Precipitation' });
    
    // Ensure it is currently unchecked (precondition check)
    await expect(precipitationToggle).not.toBeChecked();

    // Click the toggle with force: true because Chakra UI renders the real input hidden
    await precipitationToggle.click({ force: true });

    // Verify the toggle is now checked
    await expect(precipitationToggle).toBeChecked();

    // Verify the layer is actually rendered on the map via helper
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

    // Step 2: The user views the legend.
    // The legend is visible by default. We check for the Precipitation legend entry.
    const legend = page.getByRole('region', { name: 'Legend' }).or(page.getByTestId('legend'));
    
    // Check if the legend contains an entry for Precipitation.
    // The UI map mentions `precipitation-legend` as a data-testid.
    const precipitationLegend = page.getByTestId('precipitation-legend');
    
    // The legend should now display the precipitation entry.
    await expect(precipitationLegend).toBeVisible();
});
