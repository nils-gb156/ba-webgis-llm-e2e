// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../map-model-helpers';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready and initial layers to load
  await expect(page.getByTestId('map-container')).toBeVisible();

  // Locate the layer switcher panel which contains the layer toggles
  const layerSwitcher = page.getByTestId('layer-switcher');
  await expect(layerSwitcher).toBeVisible();

  // Find the UV-Index layer toggle.
  // Based on standard Chakra UI + Open Pioneer patterns, the toggle is a checkbox.
  // We scope the search to the layer switcher to avoid ambiguity.
  const uvIndexToggle = layerSwitcher.getByRole('checkbox', { name: 'UV-Index', exact: true });

  // Verify initial state: UV-Index should be unchecked
  await expect(uvIndexToggle).not.toBeChecked();

  // Click the toggle to enable the UV-Index layer
  // Note: Chakra checkboxes render the input visually hidden, so we use force: true
  await uvIndexToggle.click({ force: true });

  // Verify the toggle is now checked
  await expect(uvIndexToggle).toBeChecked();

  // Wait for the layer to be rendered on the map canvas via the helper
  await expect.poll(() => isLayerRendered(page, 'UV-Index')).toBe(true);
});
