// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { isLayerRendered } from "../../../../map-model-helpers";

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Step 1: Click the visibility toggle of the UV-Index overlay layer
  // The layer name is "UV-Index" which is a substring of "UV-Index Stations".
  // Use { exact: true } to target only the "UV-Index" checkbox.
  await page.getByRole('checkbox', { name: 'UV-Index', exact: true }).click({ force: true });

  // Assert: The UV-Index overlay layer toggle is in the enabled (checked) state
  await expect(page.getByRole('checkbox', { name: 'UV-Index', exact: true })).toBeChecked();

  // Step 2: Wait for the map to load the layer tiles
  // Assert: The UV-Index overlay tiles are rendered on the map canvas
  await expect.poll(() => isLayerRendered(page, 'UV-Index')).toBe(true);
});
