// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({
    page,
}) => {
    await page.goto('/ba-webgis-llm-e2e/');

    // Precondition: Layer switcher is visible (it is open by default)
    await expect(page.getByTestId('layer-switcher')).toBeVisible();

    // Step 1: Click the visibility toggle of the UV-Index overlay layer
    await page
        .getByRole('list', { name: 'Operational layers' })
        .getByRole('checkbox', { name: 'UV-Index', exact: true })
        .click({ force: true });

    // Expected result: The UV-Index overlay layer toggle is in the enabled (checked) state
    await expect(
        page
            .getByRole('list', { name: 'Operational layers' })
            .getByRole('checkbox', { name: 'UV-Index', exact: true })
    ).toBeChecked();

    // Step 2: Wait for the map to load the layer tiles
    // Expected result: The UV-Index overlay tiles are rendered on the map canvas
    await expect.poll(() => isLayerRendered(page, 'UV-Index')).toBe(true);
});
