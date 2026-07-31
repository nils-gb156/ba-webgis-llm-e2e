// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../map-model-helpers';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready and initial layers to load
  await expect(page.getByTestId('map-container')).toBeVisible();

  // The UV-Index layer is initially hidden. We need to find its toggle in the layer switcher.
  // Based on the UI map, the layer switcher is visible by default.
  // We look for a checkbox or toggle associated with "UV-Index".
  // Since specific test IDs for layer toggles aren't listed, we use getByRole with an exact name.
  const uvIndexToggle = page.getByRole('checkbox', { name: 'UV-Index', exact: true }).first();

  // Ensure the toggle is not already checked (precondition check)
  const isChecked = await uvIndexToggle.isChecked();
  if (!isChecked) {
    // Use force: true because Chakra UI checkboxes have a visually hidden input
    await uvIndexToggle.click({ force: true });
  }

  // Wait for the layer to be rendered on the map canvas
  await expect.poll(() => isLayerRendered(page, 'UV-Index')).toBe(true);

  // Verify the toggle is in the checked state
  await expect(uvIndexToggle).toBeChecked();
});
