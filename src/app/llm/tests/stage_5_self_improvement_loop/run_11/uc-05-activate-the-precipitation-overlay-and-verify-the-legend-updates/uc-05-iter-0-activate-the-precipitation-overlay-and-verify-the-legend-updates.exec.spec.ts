// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 5: Activate the Precipitation overlay and verify the legend updates', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Step 1: The user clicks the visibility toggle of the Precipitation overlay layer to show it.
    // The accessibility tree shows a checkbox named "Precipitation".
    // Chakra UI renders the real input visually hidden, so we use force: true.
    await page.getByRole('checkbox', { name: 'Precipitation' }).click({ force: true });

    // Expected result: The Precipitation overlay layer toggle is in the enabled (checked) state.
    await expect(page.getByRole('checkbox', { name: 'Precipitation' })).toBeChecked();

    // Verify via map model that the layer is actually rendered.
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

    // Step 2: The user views the legend.
    // Expected result: The legend displays an entry corresponding to the Precipitation layer.
    // The legend panel is visible (legend-toggle is pressed). We look for a heading
    // or text within the legend container that indicates the Precipitation layer.
    const legend = page.getByTestId('legend');
    await expect(legend).toBeVisible();
    // The legend entry is likely a heading or text node within the legend.
    await expect(legend.getByText('Precipitation', { exact: false })).toBeVisible();
});
