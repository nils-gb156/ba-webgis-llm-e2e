// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../map-model-helpers';

test('Use Case 5: Activate the Precipitation overlay and verify the legend updates', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // 1. The user clicks the visibility toggle of the Precipitation overlay layer to show it.
    // The Precipitation layer is in the operational checkbox list.
    // We use force: true because Chakra UI renders the input visually hidden.
    const precipitationToggle = page.getByRole('checkbox', { name: 'Precipitation' });
    await precipitationToggle.click({ force: true });

    // Verify the layer is actually rendered on the map via the helper
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

    // 2. The user views the legend.
    // The legend panel is visible by default inside the map-controls-panel.
    const legend = page.getByTestId('legend');
    await expect(legend).toBeVisible();

    // Expected results:
    // - The Precipitation overlay layer toggle is in the enabled (checked) state.
    await expect(precipitationToggle).toBeChecked();

    // - The legend displays an entry corresponding to the Precipitation layer.
    // We assert that the legend contains text "Precipitation" to verify the entry exists.
    await expect(legend).toContainText('Precipitation');
});
