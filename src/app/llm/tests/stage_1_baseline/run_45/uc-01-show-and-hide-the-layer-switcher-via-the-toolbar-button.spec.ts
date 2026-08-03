// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 1: Show and hide the layer switcher via the toolbar button', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('networkidle');

  const layerSwitcherButton = page.getByRole('button', { name: 'Layer Switcher', exact: true });
  const layerSwitcherHeading = page.getByRole('heading', { name: 'Layer Switcher', exact: true });

  await expect(layerSwitcherButton).toBeVisible();

  // Precondition: the app is loaded and the layer switcher is initially visible.
  await expect(layerSwitcherHeading).toBeVisible();

  // Step 1: Hide the layer switcher.
  await layerSwitcherButton.click();
  await expect(layerSwitcherHeading).not.toBeVisible();

  // Step 2: Show the layer switcher again.
  await layerSwitcherButton.click();
  await expect(layerSwitcherHeading).toBeVisible();
});
