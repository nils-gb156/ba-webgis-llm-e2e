// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const layerSwitcher = page.getByTestId('layer-switcher');
  const basemapSelector = layerSwitcher.getByRole('combobox', { name: 'Basemaps', exact: true });
  const cartoLightOption = layerSwitcher.getByRole('option', { name: 'Carto Light', exact: true });
  const openStreetMapOption = layerSwitcher.getByRole('option', { name: 'OpenStreetMap', exact: true });

  await expect(layerSwitcher).toBeVisible();
  await expect(basemapSelector).toBeVisible();

  await expect.poll(async () => {
    return await basemapSelector.evaluate((el) => {
      return (el as HTMLSelectElement).selectedOptions[0]?.textContent?.trim();
    });
  }).toBe('Carto Light');

  await expect.poll(async () => {
    return await cartoLightOption.evaluate((el) => {
      return (el as HTMLOptionElement).selected;
    });
  }).toBe(true);

  await basemapSelector.selectOption({ label: 'OpenStreetMap' });

  await expect.poll(async () => {
    return await basemapSelector.evaluate((el) => {
      return (el as HTMLSelectElement).selectedOptions[0]?.textContent?.trim();
    });
  }).toBe('OpenStreetMap');

  await expect.poll(async () => {
    return await openStreetMapOption.evaluate((el) => {
      return (el as HTMLOptionElement).selected;
    });
  }).toBe(true);

  await expect.poll(async () => {
    return await cartoLightOption.evaluate((el) => {
      return (el as HTMLOptionElement).selected;
    });
  }).toBe(false);
});
