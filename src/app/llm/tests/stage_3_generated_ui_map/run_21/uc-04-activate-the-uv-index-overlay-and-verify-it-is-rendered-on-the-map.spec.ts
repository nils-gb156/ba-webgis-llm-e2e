// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../map-model-helpers';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready and initial layers to load
  await expect(page.getByTestId('map-container')).toBeVisible();

  // The UV-Index overlay is initially hidden. We need to find its toggle in the layer switcher.
  // The layer switcher panel is visible by default.
  const layerSwitcherPanel = page.getByTestId('layer-switcher');
  await expect(layerSwitcherPanel).toBeVisible();

  // Locate the UV-Index layer item. Based on typical Chakra/React patterns in Pioneer,
  // layer items often have test ids or accessible names.
  // The UI map lists "layer-switcher" as a panel. We need to find the specific layer toggle.
  // Since no specific test id for the layer toggle is in the "Components" table,
  // we look for the layer name "UV-Index" within the layer switcher.
  // Using getByRole('checkbox') or 'switch' with the accessible name "UV-Index".
  // Note: Chakra checkboxes render the input visually hidden. We must use force: true.
  const uvIndexToggle = layerSwitcherPanel.getByRole('checkbox', { name: 'UV-Index' });

  // Ensure it is currently unchecked (hidden) before clicking
  await expect(uvIndexToggle).not.toBeChecked();

  // Click the toggle to activate the layer
  await uvIndexToggle.click({ force: true });

  // Verify the toggle is now checked
  await expect(uvIndexToggle).toBeChecked();

  // Wait for the layer tiles to be rendered on the map canvas via the helper
  await expect.poll(() => isLayerRendered(page, 'UV-Index')).toBe(true);
});
