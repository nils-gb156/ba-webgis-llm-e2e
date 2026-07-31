// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({
    page,
}) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Step 1: Click the visibility toggle of the UV-Index overlay layer
    await page.getByRole('checkbox', { name: 'UV-Index' }).click({ force: true });

    // Verify the checkbox is checked
    await expect(page.getByRole('checkbox', { name: 'UV-Index' })).toBeChecked();

    // Step 2: Wait for the map to load the layer tiles
    // The layer is rendered on the canvas, so we use the helper to check if it's visible
    await expect.poll(() => isLayerRendered(page, 'UV-Index')).toBe(true);
});
