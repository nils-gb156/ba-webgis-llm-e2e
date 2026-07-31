// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { isLayerRendered } from '../../../../map-model-helpers';

test('UC5: Activate the Precipitation overlay and verify the legend updates', async ({
    page,
}) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Step 1: The user clicks the visibility toggle of the Precipitation overlay layer to show it.
    // The checkbox is unchecked initially.
    const precipitationCheckbox = page.getByRole('checkbox', { name: 'Precipitation' });
    await expect(precipitationCheckbox).not.toBeChecked();
    await precipitationCheckbox.click({ force: true });

    // Step 2: The user views the legend.
    // Expected results:
    // - The Precipitation overlay layer toggle is in the enabled (checked) state.
    await expect(precipitationCheckbox).toBeChecked();

    // - The legend displays an entry corresponding to the Precipitation layer.
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);
});
