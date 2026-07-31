// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({
    page,
}) => {
    await page.goto('/ba-webgis-llm-e2e/');

    // Precondition: Layer switcher is visible and UV-Index checkbox is unchecked.
    await expect(page.getByTestId('layer-switcher')).toBeVisible();
    await expect(page.getByRole('checkbox', { name: 'UV-Index' })).not.toBeChecked();

    // Step 1: Click the visibility toggle of the UV-Index overlay layer.
    await page.getByRole('checkbox', { name: 'UV-Index' }).click({ force: true });

    // Expected result 1: The UV-Index overlay layer toggle is in the enabled (checked) state.
    await expect(page.getByRole('checkbox', { name: 'UV-Index' })).toBeChecked();

    // Step 2: Wait for the map to load the layer tiles.
    // Expected result 2: The UV-Index overlay tiles are rendered on the map canvas.
    await expect.poll(() => isLayerRendered(page, 'UV-Index')).toBe(true);
});
