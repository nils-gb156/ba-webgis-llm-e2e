// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Step 1: The user clicks the visibility toggle of the UV-Index overlay layer to show it.
    // There are two checkboxes whose accessible names contain "UV-Index":
    //   "UV-Index Stations" (checked, visible) and "UV-Index" (unchecked, hidden).
    // We scope the lookup to the "Operational layers" list to target the correct one.
    const operationalLayersList = page.getByRole('list', { name: 'Operational layers' });
    const uvIndexCheckbox = operationalLayersList.getByRole('checkbox', { name: 'UV-Index', exact: true });
    await uvIndexCheckbox.click({ force: true });

    // Step 2: The user waits for the map to load the layer tiles.
    // Expected result: The UV-Index overlay layer toggle is in the enabled (checked) state.
    await expect(uvIndexCheckbox).toBeChecked();

    // Expected result: The UV-Index overlay tiles are rendered on the map canvas.
    await expect.poll(() => isLayerRendered(page, 'UV-Index')).toBe(true);
});
