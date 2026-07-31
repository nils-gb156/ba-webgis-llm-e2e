// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../map-model-helpers';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready before interacting
  await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);

  // The UV-Index layer is initially hidden. We need to find its toggle in the layer switcher.
  // The layer switcher panel is visible by default.
  const layerSwitcherPanel = page.getByRole('panel', { name: 'Layer Switcher' });
  
  // Locate the UV-Index layer item. It likely contains text "UV-Index".
  // We look for a checkbox or a clickable area associated with "UV-Index".
  // Based on the UI map, we don't have a specific test id for the layer toggle item,
  // so we rely on accessible names.
  const uvIndexToggle = layerSwitcherPanel.getByRole('checkbox', { name: 'UV-Index', exact: true });
  
  // Ensure the toggle is not already checked (precondition check)
  await expect(uvIndexToggle).not.toBeChecked();

  // Click the toggle to enable the layer
  await uvIndexToggle.click({ force: true });

  // Wait for the layer to become rendered on the map canvas
  await expect.poll(() => isLayerRendered(page, 'UV-Index')).toBe(true);

  // Verify the toggle is now in the enabled (checked) state
  await expect(uvIndexToggle).toBeChecked();
});
