// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../map-model-helpers';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Step 1: Click the visibility toggle of the UV-Index overlay layer to show it.
    // The UV-Index layer is not in the defaults, so it starts unchecked.
    // We use force: true because Chakra UI checkbox controls render the input visually hidden.
    const uvIndexToggle = page.getByRole('checkbox', { name: 'UV-Index' });
    await uvIndexToggle.click({ force: true });

    // Step 2: Wait for the map to load the layer tiles.
    // We assert that the UV-Index layer is rendered on the map canvas using the helper.
    // We also assert the UI toggle state.
    await expect.poll(() => isLayerRendered(page, 'UV-Index')).toBe(true);
    await expect(uvIndexToggle).toBeChecked();
});
