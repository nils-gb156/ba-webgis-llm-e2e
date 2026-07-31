// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({
  page,
}) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Step 1: The user clicks the visibility toggle of the UV-Index overlay layer to show it.
  // The layer switcher is already visible. The UV-Index checkbox is unchecked.
  // There are two checkboxes with "UV-Index" in their accessible name: "UV-Index Stations" and "UV-Index".
  // Use exact: true to target the "UV-Index" checkbox specifically.
  await page
    .getByRole('checkbox', { name: 'UV-Index', exact: true })
    .click({ force: true });

  // Verify the toggle is checked
  await expect(
    page.getByRole('checkbox', { name: 'UV-Index', exact: true }),
  ).toBeChecked();

  // Step 2: The user waits for the map to load the layer tiles.
  // Verify the UV-Index overlay tiles are rendered on the map canvas.
  await expect.poll(() => isLayerRendered(page, 'UV-Index')).toBe(true);
});
