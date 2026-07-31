// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../map-model-helpers';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready and initial layers to settle
  await expect(page.getByTestId('map-container')).toBeVisible();
  await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);

  // The UV-Index layer is initially hidden. We need to find its toggle in the layer switcher.
  // Based on the UI map, the layer switcher is visible by default.
  // We look for the checkbox/switch associated with "UV-Index" inside the layer switcher.
  // Since Chakra UI controls are tricky, we use force: true on the role locator.
  const uvIndexToggle = page.getByRole('checkbox', { name: 'UV-Index', exact: true }).first();
  
  // Ensure the toggle is clickable and not already checked
  await expect(uvIndexToggle).toBeChecked({ checked: false });
  
  // Click the toggle to enable the layer
  await uvIndexToggle.click({ force: true });

  // Verify the toggle is now checked
  await expect(uvIndexToggle).toBeChecked();

  // Wait for the UV-Index layer to be rendered on the map canvas
  await expect.poll(() => isLayerRendered(page, 'UV-Index')).toBe(true);
});
