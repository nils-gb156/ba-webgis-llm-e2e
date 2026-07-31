// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Step 1: Click the visibility toggle of the UV-Index overlay layer to show it.
    // The layer switcher is already visible per preconditions.
    // There are two checkboxes with "UV-Index" in their name: "UV-Index Stations" and "UV-Index".
    // We need the exact "UV-Index" one (the operational layer, not the stations).
    const layerSwitcher = page.getByRole('region', { name: 'Layer Switcher' });
    const uvIndexCheckbox = layerSwitcher.getByRole('checkbox', { name: 'UV-Index', exact: true });
    await uvIndexCheckbox.click();

    // Verify the toggle is in the enabled (checked) state
    await expect(uvIndexCheckbox).toBeChecked();

    // Step 2: Wait for the map to load the layer tiles.
    // The UV-Index overlay tiles are rendered on the map canvas.
    await expect.poll(() => isLayerRendered(page, 'UV-Index')).toBe(true);
});
