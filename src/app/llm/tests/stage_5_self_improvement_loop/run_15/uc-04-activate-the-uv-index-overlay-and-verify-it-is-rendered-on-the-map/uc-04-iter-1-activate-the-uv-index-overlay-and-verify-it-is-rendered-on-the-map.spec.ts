// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../../map-model-helpers';

test('UC4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Step 1: Click the visibility toggle of the UV-Index overlay layer.
    // The layer switcher is already open. The checkbox is unchecked.
    // Use { exact: true } to distinguish "UV-Index" from "UV-Index Stations".
    await page.getByRole('checkbox', { name: 'UV-Index', exact: true }).click({ force: true });

    // Step 2: Wait for the map to load the layer tiles.
    // Assert that the UV-Index overlay layer toggle is in the enabled (checked) state.
    await expect(page.getByRole('checkbox', { name: 'UV-Index', exact: true })).toBeChecked();

    // Assert that the UV-Index overlay tiles are rendered on the map canvas.
    await expect.poll(() => isLayerRendered(page, 'UV-Index')).toBe(true);
});
