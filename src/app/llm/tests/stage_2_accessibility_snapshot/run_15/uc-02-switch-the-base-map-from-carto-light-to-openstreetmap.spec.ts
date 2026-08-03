// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('UC2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const layerSwitcher = page.getByTestId('layer-switcher');
  const layerSwitcherToggle = page.getByTestId('layer-switcher-toggle');

  if (!(await layerSwitcher.isVisible())) {
    await layerSwitcherToggle.click();
  }

  await expect(layerSwitcher).toBeVisible();

  const basemapsCombobox = layerSwitcher.getByRole('combobox', {
    name: 'Basemaps',
    exact: true
  });

  await expect(basemapsCombobox).toBeVisible();

  await expect.poll(async () => {
    return await basemapsCombobox.evaluate((element) => {
      const select = element as HTMLSelectElement;
      return select.selectedOptions[0]?.textContent?.trim();
    });
  }).toBe('Carto Light');

  await basemapsCombobox.selectOption({ label: 'OpenStreetMap' });

  await expect.poll(async () => {
    return await basemapsCombobox.evaluate((element) => {
      const select = element as HTMLSelectElement;
      return select.selectedOptions[0]?.textContent?.trim();
    });
  }).toBe('OpenStreetMap');

  await expect.poll(async () => {
    return await basemapsCombobox.evaluate((element) => {
      const select = element as HTMLSelectElement;
      const cartoLightOption = Array.from(select.options).find(
        (option) => option.textContent?.trim() === 'Carto Light'
      );
      return cartoLightOption?.selected ?? false;
    });
  }).toBe(false);
});
