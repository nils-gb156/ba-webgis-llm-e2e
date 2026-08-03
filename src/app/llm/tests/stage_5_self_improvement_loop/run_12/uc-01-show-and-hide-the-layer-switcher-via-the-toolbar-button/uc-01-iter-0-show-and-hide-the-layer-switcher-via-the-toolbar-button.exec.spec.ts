// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getActiveBaseLayerTitle } from '../../../../map-model-helpers';

test('Use Case 1: Show and hide the layer switcher via the toolbar button', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const layerSwitcherPanel = page.getByTestId('layer-switcher');
  const layerSwitcherToggle = page.getByTestId('layer-switcher-toggle');

  await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
  await expect(layerSwitcherPanel).toBeVisible();
  await expect(layerSwitcherToggle).toHaveAttribute('aria-pressed', 'true');

  if ((await layerSwitcherToggle.getAttribute('aria-pressed')) !== 'false') {
    await layerSwitcherToggle.click();
  }

  await expect(layerSwitcherToggle).toHaveAttribute('aria-pressed', 'false');
  await expect(layerSwitcherPanel).toBeHidden();

  if ((await layerSwitcherToggle.getAttribute('aria-pressed')) !== 'true') {
    await layerSwitcherToggle.click();
  }

  await expect(layerSwitcherToggle).toHaveAttribute('aria-pressed', 'true');
  await expect(layerSwitcherPanel).toBeVisible();
});
