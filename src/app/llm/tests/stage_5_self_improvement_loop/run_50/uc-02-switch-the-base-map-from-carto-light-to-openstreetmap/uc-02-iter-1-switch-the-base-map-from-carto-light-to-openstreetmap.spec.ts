// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle } from "../../../../map-model-helpers";

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('domcontentloaded');

  const layerSwitcher = page.getByTestId('layer-switcher');
  await expect(layerSwitcher).toBeVisible();

  const baseMapSelector = page.getByLabel('Basemaps', { exact: true });
  await expect(baseMapSelector).toBeVisible();

  const getSelectedBaseMapLabel = async () =>
    await baseMapSelector.evaluate((element) => {
      if (!(element instanceof HTMLSelectElement)) {
        return undefined;
      }
      return element.selectedOptions[0]?.textContent?.trim();
    });

  await expect.poll(() => getActiveBaseLayerTitle(page), { timeout: 20000 }).toBe('Carto Light');
  await expect.poll(getSelectedBaseMapLabel, { timeout: 10000 }).toBe('Carto Light');

  await baseMapSelector.selectOption({ label: 'OpenStreetMap' });

  await expect.poll(() => getActiveBaseLayerTitle(page), { timeout: 20000 }).toBe('OpenStreetMap');
  await expect.poll(() => getActiveBaseLayerTitle(page), { timeout: 20000 }).not.toBe('Carto Light');
  await expect.poll(getSelectedBaseMapLabel, { timeout: 10000 }).toBe('OpenStreetMap');
});
