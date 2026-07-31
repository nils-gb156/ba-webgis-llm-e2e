// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 5: Activate the Precipitation overlay and verify the legend updates', async ({
    page,
}) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Step 1: Click the visibility toggle of the Precipitation overlay layer
    const precipCheckbox = page.getByRole('checkbox', { name: 'Precipitation' });
    await precipCheckbox.click({ force: true });

    // Step 2: Verify the Precipitation overlay layer toggle is in the enabled (checked) state
    await expect(precipCheckbox).toBeChecked();

    // Verify the layer is actually rendered on the map
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

    // Step 3: Verify the legend displays an entry corresponding to the Precipitation layer
    // The legend panel is visible (legend-toggle is pressed). Look for a heading containing "Precipitation".
    const legendHeading = page.getByRole('heading', { name: 'Precipitation' });
    await expect(legendHeading).toBeVisible();
});
