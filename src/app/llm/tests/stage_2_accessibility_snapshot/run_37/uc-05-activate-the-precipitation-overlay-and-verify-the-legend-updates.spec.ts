// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 5: Activate the Precipitation overlay and verify the legend updates', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const layerSwitcher = page.getByTestId('layer-switcher');
  const legend = page.getByTestId('legend');
  const precipitationToggle = layerSwitcher.getByRole('checkbox', {
    name: 'Precipitation',
    exact: true
  });

  await expect(layerSwitcher).toBeVisible();
  await expect(legend).toBeVisible();
  await expect(precipitationToggle).not.toBeChecked();
  await expect(legend).not.toContainText('Precipitation');

  await precipitationToggle.click({ force: true });

  await expect(precipitationToggle).toBeChecked();
  await expect(legend).toContainText('Precipitation');
});
