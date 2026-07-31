// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../map-model-helpers';

test('Use Case 5: Activate the Precipitation overlay and verify the legend updates', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Step 1: Click the visibility toggle of the Precipitation overlay layer.
    // The layer switcher is visible by default. We target the checkbox for "Precipitation".
    // Using force: true because Chakra UI checkboxes have a hidden input underneath a decorative element.
    await page.getByRole('checkbox', { name: 'Precipitation' }).click({ force: true });

    // Verify the toggle is now checked
    await expect(page.getByRole('checkbox', { name: 'Precipitation' })).toBeChecked();

    // Verify the layer is actually rendered on the map via the helper
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

    // Step 2: View the legend.
    // The legend is visible by default. We assert that it contains an entry for Precipitation.
    // Since the legend content is dynamic and rendered by the app, we look for text inside the legend container.
    await expect(page.getByTestId('legend').getByText('Precipitation')).toBeVisible();
});
