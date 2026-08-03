// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('UC1: Show and hide the layer switcher via the toolbar button', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const layerSwitcherToggle = page.getByRole('button', { name: /^Layer Switcher$/i });
  const layerSwitcherPanelTitle = page.getByRole('heading', { name: /^Layer Switcher$/i });

  await expect(layerSwitcherToggle).toBeVisible();
  await expect(layerSwitcherPanelTitle).toBeVisible();

  if (await layerSwitcherPanelTitle.isVisible()) {
    await layerSwitcherToggle.click();
  }

  await expect(layerSwitcherPanelTitle).toBeHidden();

  if (await layerSwitcherPanelTitle.isHidden()) {
    await layerSwitcherToggle.click();
  }

  await expect(layerSwitcherPanelTitle).toBeVisible();
});
