// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../map-model-helpers';

test('Use Case 5: Activate the Precipitation overlay and verify the legend updates', async ({
    page,
}) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Wait for the map and initial layers to be ready
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);

    // Step 1: Click the visibility toggle of the Precipitation overlay layer.
    // The layer switcher is visible by default. We locate the checkbox for "Precipitation".
    const precipitationToggle = page
        .getByRole('checkbox', { name: 'Precipitation' })
        .first();

    // Ensure the toggle is not already checked (precondition: initially hidden)
    if (!(await precipitationToggle.isChecked())) {
        await precipitationToggle.click({ force: true });
    }

    // Verify the Precipitation overlay is actually rendered on the map
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

    // Verify the toggle is in the enabled (checked) state
    await expect(precipitationToggle).toBeChecked();

    // Step 2: View the legend and verify it displays an entry for the Precipitation layer.
    // The legend panel is visible by default. We look for the precipitation legend element.
    const precipitationLegend = page.getByTestId('precipitation-legend');
    await expect(precipitationLegend).toBeVisible();
});
