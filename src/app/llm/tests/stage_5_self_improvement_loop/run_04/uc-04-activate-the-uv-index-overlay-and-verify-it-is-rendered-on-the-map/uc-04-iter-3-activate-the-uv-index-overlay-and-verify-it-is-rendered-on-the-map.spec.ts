// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({
  page,
}) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the application to be ready and the map to render initially.
  await expect(page.getByTestId('map-container')).toBeVisible();
  await expect(page.getByTestId('layer-switcher')).toBeVisible();

  // 1. Click the visibility toggle of the UV-Index overlay layer to show it.
  // The checkbox is visually hidden under a Chakra control, so we use force: true.
  // Note: The layer is labelled "UV-Index" (not "UV-Index Stations") in the list.
  const uvIndexCheckbox = page.getByRole('checkbox', { name: 'UV-Index' }).first();
  await uvIndexCheckbox.click({ force: true });

  // 2. Wait for the map to load the layer tiles.
  // Assert the checkbox state is now checked.
  await expect(uvIndexCheckbox).toBeChecked();

  // Assert the UV-Index layer is actually rendered on the map canvas.
  await expect.poll(() => isLayerRendered(page, 'UV-Index')).toBe(true);
});
