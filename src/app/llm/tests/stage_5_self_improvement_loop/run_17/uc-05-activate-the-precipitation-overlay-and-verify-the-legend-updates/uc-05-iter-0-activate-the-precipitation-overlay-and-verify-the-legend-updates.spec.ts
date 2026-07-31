// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 5: Activate the Precipitation overlay and verify the legend updates', async ({
    page,
}) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Step 1: Click the visibility toggle of the Precipitation overlay layer
    const precipitationCheckbox = page.getByRole('checkbox', { name: 'Precipitation' });
    await precipitationCheckbox.click({ force: true });

    // Step 2: Verify the Precipitation overlay layer toggle is in the enabled (checked) state
    await expect(precipitationCheckbox).toBeChecked();

    // Step 3: Verify the precipitation layer is rendered on the map
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

    // Step 4: Verify the legend displays an entry corresponding to the Precipitation layer
    await expect(page.getByRole('heading', { name: 'Precipitation', level: 1 })).toBeVisible();
});
