// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../map-model-helpers';

test('Use Case 5: Activate the Precipitation overlay and verify the legend updates', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Wait for the map to be ready and initial layers to load
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);

    // Step 1: The user clicks the visibility toggle of the Precipitation overlay layer to show it.
    // The layer switcher is visible by default. We need to find the Precipitation layer toggle.
    // Based on the UI map, we don't have a specific testid for individual layer toggles in the switcher,
    // but we can look for the layer entry in the layer switcher.
    // However, the prompt mentions "layer-switcher" panel and "legend" element.
    // Usually, layer toggles are checkboxes or similar within the layer switcher.
    // Since specific test IDs for layer items aren't listed, we might need to rely on accessible names or text.
    // Let's assume there's a way to identify the Precipitation layer toggle.
    // If not explicitly provided, we might look for text "Precipitation" within the layer switcher.
    // But strict mode might be an issue if "Precipitation" appears elsewhere.
    // Let's look for a role that might be associated with the toggle. Often it's a checkbox or button.
    // Given the Chakra UI context, it's likely a checkbox.
    
    // Attempt to find the Precipitation layer toggle within the layer switcher panel.
    const layerSwitcher = page.getByTestId('layer-switcher');
    // Assuming the layer item has some text "Precipitation" and contains a checkbox/switch/button
    // We will try to get the checkbox/switch/button associated with the text "Precipitation" inside the layer switcher.
    // If the structure is a list item with text and a control, we might need to be careful.
    // Let's try getting the button or checkbox by name "Precipitation" scoped to the layer switcher.
    const precipitationToggle = layerSwitcher.getByRole('checkbox', { name: 'Precipitation' }).or(
        layerSwitcher.getByRole('switch', { name: 'Precipitation' })
    ).or(
        layerSwitcher.getByRole('button', { name: 'Precipitation' })
    );

    // It's possible the toggle is not immediately visible or the layer is not rendered yet in the switcher if it's hidden.
    // But the layer switcher is visible by default.
    // We click the toggle. Since it's a Chakra UI control, we use force: true.
    await precipitationToggle.click({ force: true });

    // Step 2: The user views the legend.
    // Expected results:
    // 1. The Precipitation overlay layer toggle is in the enabled (checked) state.
    await expect(precipitationToggle).toBeChecked();

    // 2. The legend displays an entry corresponding to the Precipitation layer.
    // We need to assert that the legend contains "Precipitation".
    const legend = page.getByTestId('legend');
    await expect(legend.getByText('Precipitation')).toBeVisible();

    // Additionally, verify the layer is actually rendered on the map
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);
});
