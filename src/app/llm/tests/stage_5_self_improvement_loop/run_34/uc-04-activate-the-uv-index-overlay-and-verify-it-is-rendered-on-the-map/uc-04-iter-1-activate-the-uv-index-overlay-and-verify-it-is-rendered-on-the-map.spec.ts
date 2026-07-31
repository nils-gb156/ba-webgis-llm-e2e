// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({
    page,
}) => {
    await page.goto(
        'http://localhost:5173/ba-webgis-llm-e2e/',
    );

    // Step 1: Click the visibility toggle of the UV-Index overlay layer
    // The list "Operational layers" contains two checkboxes with "UV-Index" in their accessible name:
    // "UV-Index Stations" (checked) and "UV-Index" (unchecked). Use exact: true to target the latter.
    const uvIndexCheckbox = page
        .getByRole('list', { name: 'Operational layers' })
        .getByRole('checkbox', { name: 'UV-Index', exact: true });

    await uvIndexCheckbox.click({ force: true });

    // Step 2: Wait for the map to load the layer tiles and verify the layer is rendered
    // The helper uses the operational layer title "UV-Index" to check visibility.
    await expect.poll(() => isLayerRendered(page, 'UV-Index')).toBe(true);

    // Verify the UV-Index overlay layer toggle is in the enabled (checked) state
    await expect(uvIndexCheckbox).toBeChecked();
});
