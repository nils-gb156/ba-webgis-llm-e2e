// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../map-model-helpers';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Wait for the map to be ready before interacting
    await expect(page.getByTestId('map-container')).toBeVisible();

    // The layer switcher is visible by default.
    // Locate the UV-Index layer toggle within the layer switcher.
    // Based on typical Open Pioneer Trails structure, layer toggles are often buttons
    // with an accessible name matching the layer title, or a specific test id.
    // Since no specific test id for the UV-Index toggle is listed in the UI Map,
    // we use getByRole with the exact layer name scoped to the layer-switcher panel.
    const layerSwitcher = page.getByTestId('layer-switcher');
    const uvIndexToggle = layerSwitcher.getByRole('checkbox', { name: 'UV-Index', exact: true });

    // Click the toggle to enable the UV-Index layer.
    // Using force: true because Chakra UI checkboxes render the input visually hidden.
    await uvIndexToggle.click({ force: true });

    // Verify the toggle is now checked
    await expect(uvIndexToggle).toBeChecked();

    // Wait for the UV-Index layer to be rendered on the map canvas.
    // Using expect.poll to retry until the layer is actually rendered.
    await expect.poll(() => isLayerRendered(page, 'UV-Index')).toBe(true);
});
