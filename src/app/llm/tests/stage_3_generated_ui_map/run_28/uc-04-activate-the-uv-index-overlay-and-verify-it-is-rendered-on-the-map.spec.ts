// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../map-model-helpers';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Wait for the map and initial layers to be ready
    await expect(page.getByTestId('map-container')).toBeVisible();

    // The UV-Index layer is initially hidden. We need to find its toggle in the layer switcher.
    // Based on standard patterns, the layer switcher lists layers with checkboxes/toggles.
    // We look for the layer named "UV-Index" within the layer switcher panel.
    const layerSwitcher = page.getByTestId('layer-switcher');
    const uvIndexToggle = layerSwitcher.getByRole('checkbox', { name: 'UV-Index', exact: true });

    // Assert initial state: UV-Index should be unchecked
    await expect(uvIndexToggle).not.toBeChecked();

    // Click the visibility toggle to enable the UV-Index layer
    await uvIndexToggle.click({ force: true });

    // Assert that the toggle is now checked
    await expect(uvIndexToggle).toBeChecked();

    // Wait for the layer to be rendered on the map canvas
    await expect.poll(() => isLayerRendered(page, 'UV-Index')).toBe(true);
});
