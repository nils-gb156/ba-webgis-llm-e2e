// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle } from "../../../../map-model-helpers";

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const layerSwitcher = page.getByTestId('layer-switcher');
  await expect(layerSwitcher).toBeVisible();

  const baseMapSelector = layerSwitcher.getByRole('combobox', { name: 'Basemaps', exact: true });
  await expect(baseMapSelector).toBeVisible();

  await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
  await expect
    .poll(async () =>
      await baseMapSelector.evaluate((element) =>
        element instanceof HTMLSelectElement
          ? element.selectedOptions[0]?.textContent?.trim()
          : undefined
      )
    )
    .toBe('Carto Light');

  await baseMapSelector.click();
  await baseMapSelector.selectOption({ label: 'OpenStreetMap' });

  await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('OpenStreetMap');
  await expect.poll(() => getActiveBaseLayerTitle(page)).not.toBe('Carto Light');
  await expect
    .poll(async () =>
      await baseMapSelector.evaluate((element) =>
        element instanceof HTMLSelectElement
          ? element.selectedOptions[0]?.textContent?.trim()
          : undefined
      )
    )
    .toBe('OpenStreetMap');
});
