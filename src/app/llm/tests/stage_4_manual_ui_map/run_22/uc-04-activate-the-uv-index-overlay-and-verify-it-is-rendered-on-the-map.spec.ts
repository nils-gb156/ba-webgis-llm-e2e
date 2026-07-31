// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../map-model-helpers';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready before interacting
  await page.waitForSelector('[data-testid="map-container"]');

  // Step 1: Click the visibility toggle of the UV-Index overlay layer.
  // The layer switcher is visible by default. The UV-Index layer is initially hidden.
  // We use force: true because Chakra UI checkboxes render the input visually hidden.
  const uvIndexToggle = page.getByRole('checkbox', { name: 'UV-Index' });
  await uvIndexToggle.click({ force: true });

  // Verify the toggle is now checked
  await expect(uvIndexToggle).toBeChecked();

  // Step 2: Wait for the map to load the layer tiles and verify it is rendered.
  // The layer tiles load asynchronously, so we poll the map model helper.
  await expect.poll(() => isLayerRendered(page, 'UV-Index')).toBe(true);
});
