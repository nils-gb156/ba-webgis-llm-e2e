// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../map-model-helpers';

test('Use Case 5: Activate the Precipitation overlay and verify the legend updates', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // 1. The user clicks the visibility toggle of the Precipitation overlay layer to show it.
  // The Precipitation layer is initially hidden. We need to find its checkbox in the layer switcher.
  // We use force: true because Chakra UI renders the input visually hidden.
  const precipitationToggle = page.getByRole('checkbox', { name: 'Precipitation' }).first();
  await expect(precipitationToggle).toBeChecked({ checked: false });
  await precipitationToggle.click({ force: true });

  // 2. The user views the legend.
  // Verify the Precipitation overlay layer toggle is in the enabled (checked) state.
  await expect(precipitationToggle).toBeChecked({ checked: true });

  // Verify the layer is actually rendered on the map
  await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

  // Verify the legend displays an entry corresponding to the Precipitation layer.
  // The legend is inside the map-controls-panel.
  const legendContainer = page.getByTestId('legend');
  await expect(legendContainer).toBeVisible();
  await expect(legendContainer.getByText('Precipitation')).toBeVisible();
});
