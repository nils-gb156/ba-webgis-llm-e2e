// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../map-model-helpers';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Wait for the map to be ready before interacting
    await expect(page.locator('#map-container')).toBeVisible();

    // The UV-Index layer is initially hidden.
    // We need to find the checkbox/switch for "UV-Index" in the layer switcher.
    // Based on the UI map, we have layer-switcher panel.
    // We look for the checkbox associated with the UV-Index label.
    // Since exact names might be ambiguous, we scope to the layer switcher.
    const layerSwitcher = page.getByRole('region', { name: /layer switcher/i, exact: true }).or(page.getByTestId('layer-switcher'));
    
    // Locate the specific checkbox for UV-Index. 
    // Note: Chakra UI renders the input hidden. We must click with force: true.
    // We use getByRole('checkbox') with the exact name "UV-Index".
    const uvIndexCheckbox = layerSwitcher.getByRole('checkbox', { name: 'UV-Index', exact: true });

    // Verify it is initially unchecked (hidden)
    await expect(uvIndexCheckbox).not.toBeChecked();

    // Click the checkbox to enable the layer
    await uvIndexCheckbox.click({ force: true });

    // Verify the checkbox is now checked
    await expect(uvIndexCheckbox).toBeChecked();

    // Wait for the layer to be rendered on the map canvas via the helper
    await expect.poll(() => isLayerRendered(page, 'UV-Index')).toBe(true);
});
