// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 5: Activate the Precipitation overlay and verify the legend updates', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const mapContainer = page.getByTestId('map-container');
  const layerSwitcher = page.getByTestId('layer-switcher');
  const layerSwitcherToggle = page.getByTestId('layer-switcher-toggle');
  const legend = page.getByTestId('legend');
  const legendToggle = page.getByTestId('legend-toggle');

  await expect(mapContainer).toBeVisible();
  await expect(layerSwitcherToggle).toBeVisible();
  await expect(legendToggle).toBeVisible();

  if (!(await layerSwitcher.isVisible())) {
    if ((await layerSwitcherToggle.getAttribute('aria-pressed')) !== 'true') {
      await layerSwitcherToggle.click();
    }
  }
  await expect(layerSwitcher).toBeVisible();
  await expect(layerSwitcherToggle).toHaveAttribute('aria-pressed', 'true');

  if (!(await legend.isVisible())) {
    if ((await legendToggle.getAttribute('aria-pressed')) !== 'true') {
      await legendToggle.click();
    }
  }
  await expect(legend).toBeVisible();
  await expect(legendToggle).toHaveAttribute('aria-pressed', 'true');

  const precipitationToggle = layerSwitcher.getByRole('checkbox', {
    name: 'Precipitation',
    exact: true
  });

  await expect(precipitationToggle).not.toBeChecked();
  await precipitationToggle.click({ force: true });
  await expect(precipitationToggle).toBeChecked();

  await expect(legend).toBeVisible();
  await expect(
    legend.getByRole('heading', { name: /Precipitation/i })
  ).toBeVisible();
});
