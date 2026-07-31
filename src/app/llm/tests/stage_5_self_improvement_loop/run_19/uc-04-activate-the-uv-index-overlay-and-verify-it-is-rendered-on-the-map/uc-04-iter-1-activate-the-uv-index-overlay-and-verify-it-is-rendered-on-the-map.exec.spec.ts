// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Wait for the map to be ready before interacting with the layer switcher
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

    // Click the UV-Index checkbox to enable the overlay.
    // Use { exact: true } to distinguish from "UV-Index Stations".
    // Use force: true because Chakra UI renders the real checkbox visually hidden
    // underneath a decorative control element.
    await page.getByRole('checkbox', { name: 'UV-Index', exact: true }).click({ force: true });

    // Assert that the checkbox is now checked
    await expect(page.getByRole('checkbox', { name: 'UV-Index', exact: true })).toBeChecked();

    // Assert that the UV-Index layer tiles are rendered on the map canvas
    await expect.poll(() => isLayerRendered(page, 'UV-Index')).toBe(true);
});
