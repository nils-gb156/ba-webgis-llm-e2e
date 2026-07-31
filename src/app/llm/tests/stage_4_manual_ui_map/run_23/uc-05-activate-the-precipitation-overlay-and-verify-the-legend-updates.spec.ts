// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../map-model-helpers';

test('Use Case 5: Activate the Precipitation overlay and verify the legend updates', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Step 1: The user clicks the visibility toggle of the Precipitation overlay layer to show it.
    // The layer switcher is visible by default, so we can interact with it directly.
    // We use force: true because Chakra UI checkbox controls have a hidden input underneath a decorative element.
    const precipitationToggle = page.getByRole('checkbox', { name: 'Precipitation' });
    await precipitationToggle.click({ force: true });

    // Verify the toggle is checked
    await expect(precipitationToggle).toBeChecked();

    // Verify the layer is actually rendered on the map via the helper
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

    // Step 2: The user views the legend.
    // The legend is visible by default. We assert that it contains an entry for Precipitation.
    const legend = page.getByTestId('legend');
    await expect(legend).toBeVisible();

    // The legend should display an entry corresponding to the Precipitation layer.
    // We look for text "Precipitation" within the legend container.
    await expect(legend.getByText('Precipitation')).toBeVisible();
});
