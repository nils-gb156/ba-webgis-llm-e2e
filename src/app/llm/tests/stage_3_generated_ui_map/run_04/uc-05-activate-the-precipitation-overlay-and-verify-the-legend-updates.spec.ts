// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../map-model-helpers';

test('Use Case 5: Activate the Precipitation overlay and verify the legend updates', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Wait for the map and initial layers to settle
    await expect(page.getByTestId('map-container')).toBeVisible();
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);

    // Step 1: Click the visibility toggle of the Precipitation overlay layer.
    // The layer switcher is visible by default. We need to find the Precipitation layer entry.
    // Based on the UI map, we have `layer-switcher` panel. The individual layer items are not explicitly named with test-ids in the summary,
    // but typically they are inside the layer switcher. Let's look for a button or checkbox labeled "Precipitation".
    // Since `layer-switcher-toggle` is for the panel itself, and the panel is already visible, we look inside the panel.
    // We will use `getByRole` with exact name to find the checkbox/button for Precipitation.
    
    const layerSwitcher = page.getByTestId('layer-switcher');
    // Assuming the layer item has a checkbox or button role with the name "Precipitation"
    // If it's a Chakra checkbox, we use force: true as per conventions.
    const precipitationToggle = layerSwitcher.getByRole('checkbox', { name: 'Precipitation', exact: true });
    
    // It might be a switch or a checkbox. Let's try checkbox first. If not found, it might be a button acting as a toggle.
    // However, the UI map mentions "layer-switcher" is a panel. Usually, layers are listed with checkboxes.
    // Let's assume it's a checkbox for visibility.
    await expect(precipitationToggle).toBeVisible();
    await precipitationToggle.click({ force: true });

    // Verify the toggle is now checked
    await expect(precipitationToggle).toBeChecked();

    // Verify the layer is rendered on the map
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

    // Step 2: View the legend and verify it displays an entry for the Precipitation layer.
    // The legend is visible by default.
    const legend = page.getByTestId('legend');
    await expect(legend).toBeVisible();

    // Check for the precipitation legend entry.
    // The UI map lists `precipitation-legend` as a data-testid.
    const precipitationLegend = page.getByTestId('precipitation-legend');
    await expect(precipitationLegend).toBeVisible();
});
