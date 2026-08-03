// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const layerSwitcher = page.getByTestId('layer-switcher');
  const layerSwitcherToggle = page.getByTestId('layer-switcher-toggle');
  const basemapSelector = page.getByRole('combobox', { name: 'Basemaps', exact: true });

  if (!(await layerSwitcher.isVisible())) {
    if ((await layerSwitcherToggle.getAttribute('aria-pressed')) !== 'true') {
      await layerSwitcherToggle.click();
    }
  }

  await expect(layerSwitcher).toBeVisible();
  await expect(basemapSelector).toBeVisible();

  await expect
    .poll(async () =>
      basemapSelector.evaluate((element) => {
        const select = element as HTMLSelectElement;
        return select.selectedOptions[0]?.textContent?.trim();
      })
    )
    .toBe('Carto Light');

  await basemapSelector.click();
  await basemapSelector.selectOption({ label: 'OpenStreetMap' });

  await expect
    .poll(async () =>
      basemapSelector.evaluate((element) => {
        const select = element as HTMLSelectElement;
        return select.selectedOptions[0]?.textContent?.trim();
      })
    )
    .toBe('OpenStreetMap');

  await expect
    .poll(async () =>
      basemapSelector.evaluate((element) => {
        const select = element as HTMLSelectElement;
        return select.selectedOptions[0]?.textContent?.trim();
      })
    )
    .not.toBe('Carto Light');
});
