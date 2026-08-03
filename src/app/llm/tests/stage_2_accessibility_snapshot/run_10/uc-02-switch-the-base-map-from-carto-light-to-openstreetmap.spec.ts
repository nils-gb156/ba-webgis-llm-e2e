// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const mapContainer = page.getByTestId('map-container');
  const layerSwitcher = page.getByTestId('layer-switcher');
  const layerSwitcherToggle = page.getByTestId('layer-switcher-toggle');

  await expect(mapContainer).toBeVisible();

  if (!(await layerSwitcher.isVisible())) {
    await layerSwitcherToggle.click();
  }
  await expect(layerSwitcher).toBeVisible();

  const basemapSelector = layerSwitcher.getByRole('combobox', { name: 'Basemaps', exact: true });
  await expect(basemapSelector).toBeVisible();

  const getSelectedBasemap = async () =>
    await basemapSelector.evaluate((element) => {
      const select = element as HTMLSelectElement;
      return select.selectedOptions[0]?.textContent?.trim() ?? '';
    });

  await expect.poll(getSelectedBasemap).toBe('Carto Light');

  await basemapSelector.click();
  await basemapSelector.selectOption({ label: 'OpenStreetMap' });

  await expect.poll(getSelectedBasemap).toBe('OpenStreetMap');
  await expect.poll(getSelectedBasemap).not.toBe('Carto Light');
});
