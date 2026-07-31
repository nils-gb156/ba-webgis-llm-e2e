// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../map-model-helpers';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map and UI to be ready
  await expect(page.getByTestId('map-container')).toBeVisible();

  // Step 1: Click the visibility toggle of the UV-Index overlay layer.
  // The UV-Index layer is in the operational checkbox list.
  // We use force: true because Chakra UI checkbox controls render the input visually hidden.
  const uvIndexToggle = page.getByRole('checkbox', { name: 'UV-Index' });
  await uvIndexToggle.click({ force: true });

  // Step 2: Wait for the map to load the layer tiles and verify the layer is rendered.
  // We poll the map model helper to wait for the asynchronous layer rendering.
  await expect.poll(() => isLayerRendered(page, 'UV-Index')).toBe(true);

  // Expected result: The UV-Index overlay layer toggle is in the enabled (checked) state.
  await expect(uvIndexToggle).toBeChecked();
});
