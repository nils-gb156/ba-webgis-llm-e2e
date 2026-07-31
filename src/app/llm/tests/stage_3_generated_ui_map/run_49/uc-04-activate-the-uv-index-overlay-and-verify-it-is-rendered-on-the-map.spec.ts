// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../map-model-helpers';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready and initial layers to load
  await expect(page.getByTestId('map-container')).toBeVisible();

  // The UV-Index layer is initially hidden. We need to find its toggle in the layer switcher.
  // The layer switcher is visible by default. We look for the checkbox associated with "UV-Index".
  // Since "UV-Index" might be ambiguous, we scope to the layer-switcher panel.
  const layerSwitcher = page.getByTestId('layer-switcher');
  const uvIndexCheckbox = layerSwitcher.getByRole('checkbox', { name: 'UV-Index', exact: true });

  // Verify it is initially unchecked
  await expect(uvIndexCheckbox).not.toBeChecked();

  // Click the checkbox to enable the layer. Using force: true as Chakra UI checkboxes are tricky.
  await uvIndexCheckbox.click({ force: true });

  // Wait for the layer to be visually rendered on the map canvas
  await expect.poll(() => isLayerRendered(page, 'UV-Index')).toBe(true);

  // Verify the toggle is now in the enabled (checked) state
  await expect(uvIndexCheckbox).toBeChecked();
});
