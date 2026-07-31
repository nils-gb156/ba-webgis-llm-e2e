// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../map-model-helpers';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map and initial layers to be ready
  await expect(page.getByTestId('map-container')).toBeVisible();

  // The layer switcher is visible by default.
  // We need to find the UV-Index layer in the layer switcher and click its checkbox.
  // Since we don't have a specific test-id for the layer item, we use the accessible name.
  // Chakra UI checkboxes are rendered with the input visually hidden, so we must use force: true.
  const uvIndexToggle = page.getByRole('checkbox', { name: 'UV-Index', exact: true });
  await uvIndexToggle.click({ force: true });

  // Verify the toggle is now checked
  await expect(uvIndexToggle).toBeChecked();

  // Wait for the layer to be rendered on the map canvas via the helper function
  await expect.poll(() => isLayerRendered(page, 'UV-Index')).toBe(true);
});
