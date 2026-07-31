// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Step 1: Click the visibility toggle of the UV-Index overlay layer.
  // The checkbox is in the layer switcher list.
  await page.getByRole('checkbox', { name: 'UV-Index' }).click({ force: true });

  // Step 2: Wait for the layer to be rendered on the map canvas.
  // The layer toggle should be checked.
  await expect(page.getByRole('checkbox', { name: 'UV-Index' })).toBeChecked();

  // The UV-Index overlay tiles should be rendered on the map.
  await expect.poll(() => isLayerRendered(page, 'UV-Index')).toBe(true);
});
