// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 5: Activate the Precipitation overlay and verify the legend updates', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // 1. The user clicks the visibility toggle of the Precipitation overlay layer to show it.
    const precipCheckbox = page.getByRole('checkbox', { name: 'Precipitation' });
    await precipCheckbox.click();

    // Verify the checkbox is now checked
    await expect(precipCheckbox).toBeChecked();

    // Verify the layer is actually rendered on the map via the map model helper
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

    // 2. The user views the legend.
    // Verify the legend displays an entry corresponding to the Precipitation layer.
    const legend = page.getByTestId('legend');
    await expect(legend.getByText(/Precipitation/i, { exact: false })).toBeVisible();
});
