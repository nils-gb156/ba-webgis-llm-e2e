// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Step 1: Click the visibility toggle of the UV-Index overlay layer.
  // The layer switcher is already visible. The UV-Index checkbox is unchecked.
  // There are two checkboxes with "UV-Index" in their accessible name:
  //   - "UV-Index Stations" (checked)
  //   - "UV-Index" (unchecked)
  // Use exact match to target the correct one.
  // Chakra UI renders the real <input> visually hidden under a decorative control element.
  // Use force: true to click the role-bearing checkbox directly.
  const uvIndexCheckbox = page.getByRole('checkbox', { name: 'UV-Index', exact: true });
  await uvIndexCheckbox.click({ force: true });

  // Verify the toggle is now in the checked state.
  await expect(uvIndexCheckbox).toBeChecked();

  // Step 2: Wait for the map to load the layer tiles.
  // Verify the UV-Index overlay tiles are rendered on the map canvas.
  await expect.poll(() => isLayerRendered(page, 'UV-Index')).toBe(true);
});
