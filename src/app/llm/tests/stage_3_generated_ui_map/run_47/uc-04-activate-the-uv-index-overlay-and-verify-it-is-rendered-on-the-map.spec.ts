// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../map-model-helpers';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map and initial layers to settle
  await expect(page.getByTestId('map-container')).toBeVisible();

  // Step 1: Click the visibility toggle of the UV-Index overlay layer.
  // The layer switcher is visible by default. We need to find the UV-Index layer entry.
  // Based on the UI map, we don't have a specific testid for the layer item itself,
  // but we have the layer-switcher panel. We will look for the text "UV-Index" within the layer switcher.
  // Chakra UI checkboxes render visually hidden inputs. We must use force: true.
  const layerSwitcher = page.getByTestId('layer-switcher');
  const uvIndexCheckbox = layerSwitcher.getByRole('checkbox', { name: 'UV-Index' });

  // Ensure the checkbox is currently unchecked (hidden by default)
  await expect(uvIndexCheckbox).not.toBeChecked();

  // Click the checkbox to enable the layer
  await uvIndexCheckbox.click({ force: true });

  // Verify the toggle is now in the enabled (checked) state
  await expect(uvIndexCheckbox).toBeChecked();

  // Step 2: Wait for the map to load the layer tiles.
  // We use the helper function to check if the layer is rendered on the canvas.
  await expect.poll(() => isLayerRendered(page, 'UV-Index')).toBe(true);
});
