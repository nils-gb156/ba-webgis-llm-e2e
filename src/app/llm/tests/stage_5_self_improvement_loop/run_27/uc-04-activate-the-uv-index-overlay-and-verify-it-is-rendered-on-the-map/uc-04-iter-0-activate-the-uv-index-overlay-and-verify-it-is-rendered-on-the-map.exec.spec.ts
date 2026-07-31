// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({
    page,
}) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Step 1: Click the visibility toggle of the UV-Index overlay layer to show it.
    // The checkbox is visually hidden behind a Chakra UI decorative element, so we use force: true.
    const uvIndexCheckbox = page.getByRole('checkbox', { name: 'UV-Index' });
    await uvIndexCheckbox.click({ force: true });

    // Step 2: Wait for the map to load the layer tiles and verify the layer is rendered.
    await expect.poll(() => isLayerRendered(page, 'UV-Index')).toBe(true);

    // Expected result: The UV-Index overlay layer toggle is in the enabled (checked) state.
    await expect(uvIndexCheckbox).toBeChecked();
});
