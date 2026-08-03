// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 1: Show and hide the layer switcher via the toolbar button', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const layerSwitcherPanel = page.getByTestId('layer-switcher');
  const layerSwitcherToggle = page.getByTestId('layer-switcher-toggle');

  await expect(layerSwitcherToggle).toBeVisible();
  await expect(layerSwitcherPanel).toBeVisible();

  const pressedBeforeHide = await layerSwitcherToggle.getAttribute('aria-pressed');
  if (pressedBeforeHide === 'false') {
    throw new Error('The layer switcher toggle is already inactive although the panel should be visible initially.');
  }

  await layerSwitcherToggle.click();
  await expect(layerSwitcherPanel).not.toBeVisible();

  const pressedBeforeShow = await layerSwitcherToggle.getAttribute('aria-pressed');
  if (pressedBeforeShow !== 'true') {
    await layerSwitcherToggle.click();
  }

  await expect(layerSwitcherPanel).toBeVisible();
});
