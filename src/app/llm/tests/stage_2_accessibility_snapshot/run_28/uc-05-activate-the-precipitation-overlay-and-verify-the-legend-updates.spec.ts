// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 5: Activate the Precipitation overlay and verify the legend updates', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const layerSwitcherToggle = page.getByTestId('layer-switcher-toggle');
  const layerSwitcher = page.getByTestId('layer-switcher');
  if (!(await layerSwitcher.isVisible()) && (await layerSwitcherToggle.getAttribute('aria-pressed')) !== 'true') {
    await layerSwitcherToggle.click();
  }
  await expect(layerSwitcher).toBeVisible();

  const legendToggle = page.getByTestId('legend-toggle');
  const legend = page.getByTestId('legend');
  if (!(await legend.isVisible()) && (await legendToggle.getAttribute('aria-pressed')) !== 'true') {
    await legendToggle.click();
  }
  await expect(legend).toBeVisible();

  const precipitationCheckbox = layerSwitcher.getByRole('checkbox', {
    name: 'Precipitation',
    exact: true
  });

  await expect(precipitationCheckbox).not.toBeChecked();

  await precipitationCheckbox.click({ force: true });
  await expect(precipitationCheckbox).toBeChecked();

  await expect(
    legend.getByRole('heading', {
      name: /^Precipitation/i
    })
  ).toBeVisible();
});
