// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../map-model-helpers';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready and initial layers to load
  await expect(page.getByTestId('map-container')).toBeVisible();
  
  // The layer switcher is visible by default. We need to find the UV-Index layer toggle.
  // Based on the UI map, we don't have a specific test id for the layer toggle items,
  // so we rely on the layer switcher panel and look for the layer name.
  // We assume the layer switcher contains checkboxes or similar controls for layers.
  // Since "UV-Index" is the layer name, we look for a checkbox with that accessible name inside the layer switcher.
  const layerSwitcher = page.getByTestId('layer-switcher');
  const uvIndexToggle = layerSwitcher.getByRole('checkbox', { name: 'UV-Index' });

  // Assert initial state: UV-Index should be unchecked (hidden)
  await expect(uvIndexToggle).not.toBeChecked();

  // Step 1: Click the visibility toggle of the UV-Index overlay layer
  // Using force: true because Chakra UI checkboxes render visually hidden inputs
  await uvIndexToggle.click({ force: true });

  // Assert the toggle is now checked
  await expect(uvIndexToggle).toBeChecked();

  // Step 2: Wait for the map to load the layer tiles
  // We poll the map model helper to check if the UV-Index layer is rendered
  await expect.poll(() => isLayerRendered(page, 'UV-Index')).toBe(true);
});
