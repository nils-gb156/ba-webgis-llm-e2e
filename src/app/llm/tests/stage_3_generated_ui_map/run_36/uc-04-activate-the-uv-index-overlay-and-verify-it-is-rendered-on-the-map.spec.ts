// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../map-model-helpers';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // The UV-Index layer is initially hidden.
  // We need to find the checkbox for "UV-Index" in the layer switcher.
  // Based on typical Chakra UI + Open Pioneer patterns, the layer switcher
  // contains checkboxes for each layer. We look for the checkbox with the accessible name "UV-Index".
  // Since "UV-Index" might be ambiguous or not unique, we scope it to the layer-switcher panel.
  const layerSwitcherPanel = page.getByRole('region', { name: 'Layer Switcher' }).or(
    page.getByTestId('layer-switcher')
  );
  
  // Try to find the checkbox. If the panel isn't named "Layer Switcher", we might need to rely on the toggle.
  // The layer switcher is visible by default according to the UI map.
  // Let's assume the panel is accessible. If not, we might need to click the toggle first, but it says visible by default.
  // We will use a robust locator for the UV-Index checkbox.
  const uvIndexCheckbox = page.getByRole('checkbox', { name: 'UV-Index' });

  // Click the checkbox to enable the layer.
  // Chakra UI checkboxes require force: true as per conventions.
  await uvIndexCheckbox.click({ force: true });

  // Verify the checkbox is now checked.
  await expect(uvIndexCheckbox).toBeChecked();

  // Wait for the layer to be rendered on the map.
  // The layer title is "UV-Index".
  await expect.poll(() => isLayerRendered(page, 'UV-Index')).toBe(true);
});
