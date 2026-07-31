// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('UC1: Show and hide the layer switcher via the toolbar button', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Verify initial state: layer switcher is visible
  await expect(page.getByTestId('layer-switcher')).toBeVisible();

  // Step 1: Click the layer switcher toggle to hide the panel
  await page.getByTestId('layer-switcher-toggle').click();

  // Expected result: layer switcher is no longer visible
  await expect(page.getByTestId('layer-switcher')).not.toBeVisible();

  // Step 2: Click the layer switcher toggle again to show the panel
  await page.getByTestId('layer-switcher-toggle').click();

  // Expected result: layer switcher is visible again
  await expect(page.getByTestId('layer-switcher')).toBeVisible();
});
