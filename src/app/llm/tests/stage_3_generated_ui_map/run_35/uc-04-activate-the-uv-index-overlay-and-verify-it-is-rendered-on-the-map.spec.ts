// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../map-model-helpers';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Wait for the map to be ready and initial layers to settle
    await expect(page.getByTestId('map-container')).toBeVisible();
    
    // Wait for the initial operational layers (Temperature, UV-Index Stations, EUCOS) to be rendered
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

    // 1. The user clicks the visibility toggle of the UV-Index overlay layer to show it.
    // The UV-Index layer is initially hidden. We locate it in the layer switcher.
    const uvIndexLayerToggle = page.getByRole('checkbox', { name: 'UV-Index', exact: true });
    await uvIndexLayerToggle.click();

    // 2. The user waits for the map to load the layer tiles.
    // Expected result: The UV-Index overlay layer toggle is in the enabled (checked) state.
    await expect(uvIndexLayerToggle).toBeChecked();

    // Expected result: The UV-Index overlay tiles are rendered on the map canvas.
    await expect.poll(() => isLayerRendered(page, 'UV-Index')).toBe(true);
});
