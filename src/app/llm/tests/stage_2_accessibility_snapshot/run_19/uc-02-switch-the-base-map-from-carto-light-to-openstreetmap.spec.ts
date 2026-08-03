// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('domcontentloaded');

  const layerSwitcher = page.getByTestId('layer-switcher');
  await expect(layerSwitcher).toBeVisible();

  const basemapSelector = layerSwitcher.getByRole('combobox', { name: 'Basemaps', exact: true });
  await expect(basemapSelector).toBeVisible();

  const selectedBasemapLabel = async () =>
    await basemapSelector.evaluate((element) => {
      if ('selectedOptions' in element) {
        return (element as HTMLSelectElement).selectedOptions[0]?.textContent?.trim() ?? '';
      }
      return '';
    });

  await expect.poll(selectedBasemapLabel).toBe('Carto Light');

  await basemapSelector.click();
  await basemapSelector.selectOption({ label: 'OpenStreetMap' });

  await expect.poll(selectedBasemapLabel).toBe('OpenStreetMap');
  await expect.poll(selectedBasemapLabel).not.toBe('Carto Light');
});
