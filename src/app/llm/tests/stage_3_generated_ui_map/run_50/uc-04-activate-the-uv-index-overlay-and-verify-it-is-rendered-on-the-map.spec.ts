// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../map-model-helpers';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map and initial layers to settle
  await expect(page.getByTestId('map-container')).toBeVisible();

  // 1. Click the visibility toggle of the UV-Index overlay layer.
  // The layer switcher is visible by default. We locate the UV-Index layer entry
  // and click its checkbox/switch. Since Chakra UI controls are tricky, we use
  // force: true on the role locator.
  const uvIndexToggle = page
    .getByTestId('layer-switcher')
    .getByRole('checkbox', { name: 'UV-Index' });

  await expect(uvIndexToggle).toBeChecked({ checked: false });
  await uvIndexToggle.click({ force: true });

  // Verify the toggle is now in the enabled (checked) state
  await expect(uvIndexToggle).toBeChecked();

  // 2. Wait for the map to load the layer tiles and verify it is rendered.
  // We poll the helper because the layer rendering is asynchronous.
  await expect.poll(() => isLayerRendered(page, 'UV-Index')).toBe(true);
});
