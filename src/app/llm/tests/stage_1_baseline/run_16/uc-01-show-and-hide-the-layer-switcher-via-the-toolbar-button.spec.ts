// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 1: Show and hide the layer switcher via the toolbar button', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const layerSwitcherToggle = page.getByRole('button', { name: 'Layer Switcher', exact: true });
  const layerSwitcherHeading = page.getByRole('heading', { name: 'Layer Switcher', exact: true });

  await expect(layerSwitcherToggle).toBeVisible();
  await expect(layerSwitcherHeading).toBeVisible();

  await layerSwitcherToggle.click();
  await expect(layerSwitcherHeading).toBeHidden();

  await layerSwitcherToggle.click();
  await expect(layerSwitcherHeading).toBeVisible();
});
