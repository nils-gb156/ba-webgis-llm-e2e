// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle } from '../../../../map-model-helpers';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const layerSwitcher = page.getByTestId('layer-switcher');
  const basemapSelector = layerSwitcher.getByRole('combobox', { name: 'Basemaps', exact: true });

  const readSelectedBasemapLabel = async () =>
    basemapSelector.evaluate((element) => {
      if (element instanceof HTMLSelectElement) {
        return element.options.item(element.selectedIndex)?.textContent?.trim();
      }

      if (element instanceof HTMLInputElement) {
        return element.value.trim();
      }

      const ariaValueText = element.getAttribute('aria-valuetext');
      if (ariaValueText) {
        return ariaValueText.trim();
      }

      return element.textContent?.trim();
    });

  await expect(layerSwitcher).toBeVisible();
  await expect(basemapSelector).toBeVisible();

  await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
  await expect.poll(readSelectedBasemapLabel).toBe('Carto Light');

  await basemapSelector.selectOption({ label: 'OpenStreetMap' });

  await expect.poll(readSelectedBasemapLabel).toBe('OpenStreetMap');
  await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('OpenStreetMap');
  await expect.poll(() => getActiveBaseLayerTitle(page)).not.toBe('Carto Light');
});
