// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../map-model-helpers';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Wait for the map to be ready before interacting
    await expect(page.getByTestId('map-container')).toBeVisible();

    // Step 1: The user clicks the visibility toggle of the UV-Index overlay layer to show it.
    // The layer switcher is visible by default. We need to find the UV-Index layer toggle.
    // Based on typical Chakra UI rendering, the checkbox input is visually hidden.
    // We use force: true to click the role directly.
    const uvIndexLayerToggle = page.getByRole('checkbox', { name: 'UV-Index', exact: true });
    await expect(uvIndexLayerToggle).toBeVisible();
    await uvIndexLayerToggle.click({ force: true });

    // Step 2: The user waits for the map to load the layer tiles.
    // We verify that the UV-Index overlay tiles are rendered on the map canvas.
    await expect.poll(() => isLayerRendered(page, 'UV-Index')).toBe(true);

    // Expected result: The UV-Index overlay layer toggle is in the enabled (checked) state.
    await expect(uvIndexLayerToggle).toBeChecked();
});
