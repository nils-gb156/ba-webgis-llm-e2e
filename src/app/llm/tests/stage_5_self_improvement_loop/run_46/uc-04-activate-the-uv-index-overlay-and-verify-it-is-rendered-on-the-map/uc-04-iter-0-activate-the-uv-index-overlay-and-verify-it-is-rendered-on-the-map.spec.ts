// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Step 1: Click the visibility toggle of the UV-Index overlay layer to show it.
  // The layer switcher is already visible. Find the checkbox for "UV-Index" within the operational layers list.
  // Use { exact: true } to avoid matching "UV-Index Stations" which appears above it.
  const uvIndexToggle = page
    .getByRole('list', { name: 'Operational layers' })
    .getByRole('checkbox', { name: 'UV-Index', exact: true });

  await uvIndexToggle.click();

  // Step 2: Wait for the map to load the layer tiles.
  // Step 2 (Expected results): The UV-Index overlay layer toggle is in the enabled (checked) state.
  await expect(uvIndexToggle).toBeChecked();

  // Step 2 (Expected results): The UV-Index overlay tiles are rendered on the map canvas.
  await expect.poll(() => isLayerRendered(page, 'UV-Index')).toBe(true);
});
