// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({
    page,
}) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Step 1: Click the visibility toggle of the UV-Index overlay layer.
    // Chakra UI checkboxes have a visually hidden <input role="checkbox"> underneath
    // a decorative <div> that intercepts pointer events.  Use force: true.
    const uvIndexCheckbox = page.getByRole('checkbox', { name: 'UV-Index', exact: true });
    await uvIndexCheckbox.click({ force: true });

    // Verify the checkbox is now checked
    await expect(uvIndexCheckbox).toBeChecked();

    // Step 2: Wait for the map to load the layer tiles and verify it is rendered.
    // Use expect.poll to wait for the asynchronous map rendering to complete.
    await expect.poll(() => isLayerRendered(page, 'UV-Index')).toBe(true);
});
