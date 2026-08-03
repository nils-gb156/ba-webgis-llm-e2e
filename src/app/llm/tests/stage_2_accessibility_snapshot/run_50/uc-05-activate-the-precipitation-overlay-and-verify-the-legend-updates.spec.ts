// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 5: Activate the Precipitation overlay and verify the legend updates', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('networkidle');

  await expect(page.getByTestId('map-container')).toBeVisible();

  const layerSwitcher = page.getByTestId('layer-switcher');
  const legend = page.getByTestId('legend');

  await expect(layerSwitcher).toBeVisible();
  await expect(legend).toBeVisible();

  const precipitationCheckbox = layerSwitcher.getByRole('checkbox', {
    name: 'Precipitation',
    exact: true
  });

  await expect(precipitationCheckbox).not.toBeChecked();

  await precipitationCheckbox.click({ force: true });
  await expect(precipitationCheckbox).toBeChecked();

  await expect(legend.getByText(/Precipitation/i)).toBeVisible();
});
