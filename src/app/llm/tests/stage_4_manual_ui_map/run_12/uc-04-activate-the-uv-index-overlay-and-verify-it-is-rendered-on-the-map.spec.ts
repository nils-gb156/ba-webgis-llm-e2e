// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../map-model-helpers';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // The UV-Index layer is initially hidden. We need to find its checkbox in the layer switcher.
  // The layer switcher is visible by default.
  const layerSwitcher = page.getByTestId('layer-switcher');
  
  // Locate the checkbox for "UV-Index". Since it's a Chakra UI checkbox, we use force: true.
  const uvIndexCheckbox = layerSwitcher.getByRole('checkbox', { name: 'UV-Index' });
  
  // Click the checkbox to enable the UV-Index layer
  await uvIndexCheckbox.click({ force: true });

  // Assert that the checkbox is now checked
  await expect(uvIndexCheckbox).toBeChecked();

  // Assert that the UV-Index layer is rendered on the map canvas using the helper
  await expect.poll(() => isLayerRendered(page, 'UV-Index')).toBe(true);
});
