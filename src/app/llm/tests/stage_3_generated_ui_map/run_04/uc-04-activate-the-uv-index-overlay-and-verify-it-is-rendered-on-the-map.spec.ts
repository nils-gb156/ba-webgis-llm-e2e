// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../map-model-helpers';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({
  page,
}) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map and initial layers to be ready
  await expect(page.getByTestId('map-container')).toBeVisible();

  // The UV-Index layer is initially hidden.
  // We need to find the checkbox for the UV-Index layer in the layer switcher.
  // Based on common patterns, the layer switcher contains checkboxes for each layer.
  // We will look for a checkbox labeled "UV-Index".
  const uvIndexCheckbox = page
    .getByTestId('layer-switcher')
    .getByRole('checkbox', { name: 'UV-Index', exact: true });

  // Click the checkbox to enable the layer.
  // Chakra UI checkboxes render the input hidden; we use force: true.
  await uvIndexCheckbox.click({ force: true });

  // Verify the checkbox is now checked
  await expect(uvIndexCheckbox).toBeChecked();

  // Wait for the UV-Index layer to be rendered on the map canvas.
  // We use expect.poll to retry until the layer is rendered.
  await expect.poll(() => isLayerRendered(page, 'UV-Index')).toBe(true);
});
