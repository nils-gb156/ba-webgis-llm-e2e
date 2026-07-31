// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../map-model-helpers';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({
  page,
}) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready and initial layers to settle
  await expect(page.getByTestId('map-container')).toBeVisible();
  await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);

  // The UV-Index overlay is initially hidden.
  // Find the layer switcher panel and click the UV-Index checkbox.
  const layerSwitcher = page.getByTestId('layer-switcher');
  const uvIndexToggle = layerSwitcher.getByRole('checkbox', { name: 'UV-Index', exact: true });

  // Click with force because Chakra UI renders the actual input visually hidden
  // underneath a decorative control element that intercepts pointer events.
  await uvIndexToggle.click({ force: true });

  // Assert that the toggle is now in the checked state
  await expect(uvIndexToggle).toBeChecked();

  // Assert that the UV-Index layer is rendered on the map canvas
  await expect.poll(() => isLayerRendered(page, 'UV-Index')).toBe(true);
});
