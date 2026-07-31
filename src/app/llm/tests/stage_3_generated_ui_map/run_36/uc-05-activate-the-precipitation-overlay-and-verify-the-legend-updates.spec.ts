// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../map-model-helpers';

test('Use Case 5: Activate the Precipitation overlay and verify the legend updates', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Wait for the map and UI to be ready
    await expect(page.getByTestId('layer-switcher')).toBeVisible();
    await expect(page.getByTestId('legend')).toBeVisible();

    // Step 1: Activate the Precipitation overlay
    // The Precipitation layer is initially hidden. We need to find its toggle in the layer switcher.
    // Based on the UI map, the layer switcher is visible by default.
    // We assume the layer items have test ids or can be identified by text.
    // Since specific layer toggle test ids are not listed in the UI map, we rely on the layer name text.
    // However, clicking by text can be ambiguous. Let's look for the layer switcher content.
    // The prompt implies we should use getByTestId if available. If not, getByRole/ByText.
    // Let's assume the layer items inside the layer switcher might have a structure.
    // Without specific test ids for layers, we will try to click the Precipitation toggle.
    // We will look for a button or checkbox-like element with text "Precipitation" inside the layer switcher.
    
    // Find the layer switcher container
    const layerSwitcher = page.getByTestId('layer-switcher');
    
    // Find the Precipitation layer toggle. 
    // Note: Chakra UI checkboxes/switches might need force: true if they are decorative.
    // We look for a role that represents a toggle or button within the layer switcher.
    // If the layer items are just text, we might need to click the text or a nearby control.
    // Let's try to find a button or checkbox with the name "Precipitation" inside the layer switcher.
    const precipToggle = layerSwitcher.getByRole('checkbox', { name: 'Precipitation', exact: true }).or(
        layerSwitcher.getByRole('button', { name: 'Precipitation', exact: true })
    );

    // It's possible the layer is not immediately visible or the toggle is a switch.
    // Let's try to click it. If it's already checked, we skip.
    // Since the precondition says it's hidden, it should be unchecked.
    await precipToggle.click({ force: true });

    // Verify the layer is rendered on the map
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

    // Step 2: View the legend
    // The legend should update to show the Precipitation layer entry.
    // We look for the precipitation legend element.
    const precipitationLegend = page.getByTestId('precipitation-legend');
    
    // Assert that the precipitation legend is visible
    await expect(precipitationLegend).toBeVisible();

    // Additionally, verify the toggle state in the UI
    // We can re-query the toggle to ensure it is checked
    await expect(precipToggle).toBeChecked();
});
