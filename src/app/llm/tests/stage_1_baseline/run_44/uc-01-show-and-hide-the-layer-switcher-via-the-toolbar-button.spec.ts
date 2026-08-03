// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('UC1 Show and hide the layer switcher via the toolbar button', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const layerSwitcherButton = page.getByRole('button', { name: 'Layer Switcher', exact: true });
  const layerSwitcherPanelTitle = page.getByRole('heading', { name: 'Layer Switcher', exact: true });

  await expect(layerSwitcherButton).toBeVisible();
  await expect(layerSwitcherPanelTitle).toBeVisible();

  await layerSwitcherButton.click();
  await expect(layerSwitcherPanelTitle).not.toBeVisible();

  await layerSwitcherButton.click();
  await expect(layerSwitcherPanelTitle).toBeVisible();
});
