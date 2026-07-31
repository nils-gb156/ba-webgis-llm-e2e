// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../map-model-helpers';

test('Use Case 5: Activate the Precipitation overlay and verify the legend updates', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready and the initial layers to render
  await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);
  await expect(page.getByTestId('layer-switcher')).toBeVisible();
  await expect(page.getByTestId('legend')).toBeVisible();

  // Step 1: Click the visibility toggle of the Precipitation overlay layer
  // The layer switcher is visible by default, so we can interact with it directly.
  // We use force: true because Chakra UI checkboxes render the input visually hidden.
  const precipitationToggle = page.getByRole('checkbox', { name: 'Precipitation' });
  await expect(precipitationToggle).toBeChecked({ checked: false });
  await precipitationToggle.click({ force: true });

  // Verify the Precipitation overlay is now rendered on the map
  await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

  // Verify the toggle is in the enabled (checked) state
  await expect(precipitationToggle).toBeChecked();

  // Step 2: View the legend and verify it reflects the newly active layer
  const legend = page.getByTestId('legend');
  await expect(legend).toBeVisible();

  // The legend should contain an entry for the Precipitation layer.
  // Since the legend content is dynamic and depends on the layer's metadata,
  // we check for the presence of text corresponding to the layer name.
  await expect(legend.getByText('Precipitation')).toBeVisible();
});
