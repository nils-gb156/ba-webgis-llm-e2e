// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 5: Activate the Precipitation overlay and verify the legend updates', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('networkidle');

  const layerSwitcher = page.getByTestId('layer-switcher');
  const layerSwitcherToggle = page.getByTestId('layer-switcher-toggle');
  const legend = page.getByTestId('legend');
  const legendToggle = page.getByTestId('legend-toggle');

  if (!(await layerSwitcher.isVisible())) {
    const pressed = await layerSwitcherToggle.getAttribute('aria-pressed');
    if (pressed !== 'true') {
      await layerSwitcherToggle.click();
    }
  }
  await expect(layerSwitcher).toBeVisible();

  if (!(await legend.isVisible())) {
    const pressed = await legendToggle.getAttribute('aria-pressed');
    if (pressed !== 'true') {
      await legendToggle.click();
    }
  }
  await expect(legend).toBeVisible();

  const precipitationLayerToggle = layerSwitcher.getByRole('checkbox', {
    name: 'Precipitation',
    exact: true
  });
  const precipitationLegendEntry = legend.getByRole('heading', {
    name: /Precipitation/i
  });

  await expect(precipitationLayerToggle).not.toBeChecked();
  await expect(precipitationLegendEntry).toHaveCount(0);

  await precipitationLayerToggle.click({ force: true });

  await expect(precipitationLayerToggle).toBeChecked();
  await expect(precipitationLegendEntry).toBeVisible();
});
