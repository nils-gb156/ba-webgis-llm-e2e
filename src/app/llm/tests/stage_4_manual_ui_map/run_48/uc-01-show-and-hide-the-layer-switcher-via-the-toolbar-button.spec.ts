// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 1: Show and hide the layer switcher via the toolbar button', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const mapContainer = page.getByTestId('map-container');
  const toolbarToggle = page.getByTestId('layer-switcher-toggle');
  const layerSwitcher = page.getByTestId('layer-switcher');

  await expect(mapContainer).toBeVisible();
  await expect(toolbarToggle).toBeVisible();

  // Precondition: the app is loaded and the layer switcher is initially visible.
  await expect(layerSwitcher).toBeVisible();

  // Step 1: click the toolbar button to hide the layer switcher.
  const pressedBeforeHide = await toolbarToggle.getAttribute('aria-pressed');
  if (pressedBeforeHide !== 'false') {
    await toolbarToggle.click();
  }
  await expect(layerSwitcher).toBeHidden();

  // Step 2: click the toolbar button again to show the layer switcher.
  const pressedBeforeShow = await toolbarToggle.getAttribute('aria-pressed');
  if (pressedBeforeShow !== 'true') {
    await toolbarToggle.click();
  }
  await expect(layerSwitcher).toBeVisible();
});
