// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 5: Activate the Precipitation overlay and verify the legend updates', async ({
    page,
}) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Step 1: Click the visibility toggle of the Precipitation overlay layer to show it.
    // Chakra UI checkboxes have a visually hidden <input> with role="checkbox"
    // and a decorative control element that intercepts pointer events.
    // Use force: true to click the role-bearing input directly.
    const precipitationCheckbox = page.getByRole('checkbox', { name: 'Precipitation' });
    await precipitationCheckbox.click({ force: true });

    // Step 2: The user views the legend.
    // Verify the Precipitation overlay layer toggle is in the enabled (checked) state.
    await expect(precipitationCheckbox).toBeChecked();

    // Verify the layer is actually rendered on the map.
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

    // Verify the legend displays an entry corresponding to the Precipitation layer.
    const legend = page.getByTestId('legend');
    await expect(legend.getByText('Precipitation')).toBeVisible();
});
