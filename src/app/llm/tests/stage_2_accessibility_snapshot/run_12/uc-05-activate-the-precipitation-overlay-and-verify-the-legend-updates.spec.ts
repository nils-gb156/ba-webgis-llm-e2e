// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 5: Activate the Precipitation overlay and verify the legend updates', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const layerSwitcher = page.getByTestId('layer-switcher');
  const layerSwitcherToggle = page.getByTestId('layer-switcher-toggle');
  if (!(await layerSwitcher.isVisible())) {
    await layerSwitcherToggle.click();
  }
  await expect(layerSwitcher).toBeVisible();

  const legend = page.getByTestId('legend');
  const legendToggle = page.getByTestId('legend-toggle');
  if (!(await legend.isVisible())) {
    await legendToggle.click();
  }
  await expect(legend).toBeVisible();

  const precipitationCheckbox = page.getByRole('checkbox', { name: 'Precipitation', exact: true });

  await expect(precipitationCheckbox).not.toBeChecked();

  await precipitationCheckbox.click({ force: true });

  await expect(precipitationCheckbox).toBeChecked();
  await expect(legend.getByRole('heading', { name: /Precipitation/i })).toBeVisible();
});
