// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 1: Show and hide the layer switcher via the toolbar button', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('networkidle');

  const layerSwitcherButton = page.getByRole('button', {
    name: 'Layer Switcher',
    exact: true
  });
  const layerSwitcherHeading = page.getByRole('heading', {
    name: 'Layer Switcher',
    exact: true
  });

  await expect(layerSwitcherButton).toBeVisible();
  await expect(layerSwitcherHeading).toBeVisible();

  const hasPressedState = (await layerSwitcherButton.getAttribute('aria-pressed')) !== null;
  if (hasPressedState) {
    await expect(layerSwitcherButton).toHaveAttribute('aria-pressed', 'true');
  }

  await layerSwitcherButton.click();

  await expect(layerSwitcherHeading).not.toBeVisible();

  if (hasPressedState) {
    await expect(layerSwitcherButton).toHaveAttribute('aria-pressed', 'false');
  }

  await layerSwitcherButton.click();

  await expect(layerSwitcherHeading).toBeVisible();

  if (hasPressedState) {
    await expect(layerSwitcherButton).toHaveAttribute('aria-pressed', 'true');
  }
});
