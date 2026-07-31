// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../map-model-helpers';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready and initial layers to render
  await expect(page.getByTestId('map-container')).toBeVisible();
  await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);

  // The UV-Index layer is initially hidden.
  // We need to find its toggle in the layer switcher.
  // Based on the UI map, the layer switcher is visible by default.
  // We look for a checkbox or similar control labeled "UV-Index" within the layer switcher.
  // Since specific test ids for individual layer toggles are not provided in the auto-generated map,
  // we fall back to getByRole with an accessible name, scoped to the layer switcher.
  const layerSwitcher = page.getByTestId('layer-switcher');
  
  // Try to find the UV-Index layer toggle. It's likely a checkbox or switch.
  // We use exact: true to avoid matching partial names if other layers exist.
  const uvIndexToggle = layerSwitcher.getByRole('checkbox', { name: 'UV-Index', exact: true }).or(
    layerSwitcher.getByRole('switch', { name: 'UV-Index', exact: true })
  );

  // Check if the toggle exists and is not already checked (though preconditions say it's hidden)
  // We force click because Chakra UI controls often have hidden inputs
  await uvIndexToggle.click({ force: true });

  // Assert that the toggle is now checked
  await expect(uvIndexToggle).toBeChecked();

  // Wait for the UV-Index layer to be rendered on the map canvas
  await expect.poll(() => isLayerRendered(page, 'UV-Index')).toBe(true);
});
