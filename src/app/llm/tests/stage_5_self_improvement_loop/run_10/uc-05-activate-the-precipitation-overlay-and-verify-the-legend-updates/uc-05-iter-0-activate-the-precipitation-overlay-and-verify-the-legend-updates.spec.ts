// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 5: Activate the Precipitation overlay and verify the legend updates', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Wait for the map to be ready before interacting
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

    // 1. The user clicks the visibility toggle of the Precipitation overlay layer to show it.
    // The checkbox is visually hidden under a Chakra control, so we use force: true.
    const precipitationToggle = page.getByRole('checkbox', { name: 'Precipitation' });
    await precipitationToggle.click({ force: true });

    // Verify the layer is actually rendered on the map
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

    // 2. The user views the legend.
    // Expected: The Precipitation overlay layer toggle is in the enabled (checked) state.
    await expect(precipitationToggle).toBeChecked();

    // Expected: The legend displays an entry corresponding to the Precipitation layer.
    // We look for the legend container which updates when layers change, and check for the
    // layer title within it.
    const legend = page.getByTestId('legend');
    await expect(legend.getByText('Precipitation', { exact: true })).toBeVisible();
});
