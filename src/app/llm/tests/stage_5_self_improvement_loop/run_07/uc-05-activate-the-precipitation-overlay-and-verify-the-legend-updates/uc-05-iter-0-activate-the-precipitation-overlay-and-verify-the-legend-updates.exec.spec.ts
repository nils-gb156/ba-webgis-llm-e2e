// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '../../../failure-snapshot-fixture';
import { isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 5: Activate the Precipitation overlay and verify the legend updates', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // 1. The user clicks the visibility toggle of the Precipitation overlay layer to show it.
    const precipitationCheckbox = page.getByRole('checkbox', { name: 'Precipitation' });
    await precipitationCheckbox.click({ force: true });

    // Verify the layer is visually rendered on the map
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

    // Verify the toggle is in the checked state
    await expect(precipitationCheckbox).toBeChecked();

    // 2. The user views the legend.
    // Expected: The legend displays an entry corresponding to the Precipitation layer.
    const legend = page.getByRole('region', { name: 'Legend' });
    await expect(legend).toContainText('Precipitation');
});
