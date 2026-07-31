// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '../../../failure-snapshot-fixture';
import { isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({
  page,
}) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Step 1: Click the visibility toggle of the UV-Index overlay layer to show it.
  // The layer switcher is already visible. We target the checkbox for "UV-Index".
  // Use { exact: true } to disambiguate from "UV-Index Stations" which also
  // matches the substring "UV-Index".
  const uvIndexCheckbox = page
    .getByRole('list', { name: 'Operational layers' })
    .getByRole('checkbox', { name: 'UV-Index', exact: true });
  await uvIndexCheckbox.click({ force: true });

  // Verify the toggle is now checked.
  await expect(uvIndexCheckbox).toBeChecked();

  // Step 2: Wait for the map to load the layer tiles.
  // Expected results: The UV-Index overlay tiles are rendered on the map canvas.
  await expect.poll(() => isLayerRendered(page, 'UV-Index')).toBe(true);
});
