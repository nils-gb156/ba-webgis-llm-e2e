// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../map-model-helpers';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map and initial layers to be ready
  await expect(page.getByTestId('map-container')).toBeVisible();
  await expect(page.getByTestId('layer-switcher')).toBeVisible();

  // The UV-Index overlay is initially hidden.
  // We need to find the toggle for the UV-Index layer in the layer switcher.
  // Since we don't have a specific test-id for the layer toggle, we use the layer name.
  // The layer switcher is visible by default.
  const layerSwitcher = page.getByTestId('layer-switcher');
  
  // Locate the UV-Index layer item and its checkbox/switch control.
  // Chakra UI controls render the input visually hidden, so we click the role with force.
  const uvIndexLayerToggle = layerSwitcher.getByRole('checkbox', { name: 'UV-Index', exact: true });

  // Click the toggle to enable the layer
  await uvIndexLayerToggle.click({ force: true });

  // Assert the toggle is now checked
  await expect(uvIndexLayerToggle).toBeChecked();

  // Wait for the UV-Index layer to be rendered on the map canvas
  await expect.poll(() => isLayerRendered(page, 'UV-Index')).toBe(true);
});
