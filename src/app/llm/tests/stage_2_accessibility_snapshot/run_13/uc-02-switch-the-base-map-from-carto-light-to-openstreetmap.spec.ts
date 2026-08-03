// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const layerSwitcher = page.getByTestId('layer-switcher');
  await expect(layerSwitcher).toBeVisible();

  const layerSwitcherToggle = page.getByTestId('layer-switcher-toggle');
  await expect(layerSwitcherToggle).toHaveAttribute('aria-pressed', 'true');

  const basemapSelector = layerSwitcher.getByRole('combobox', {
    name: 'Basemaps',
    exact: true
  });
  await expect(basemapSelector).toBeVisible();

  const cartoLightOption = basemapSelector.getByRole('option', {
    name: 'Carto Light',
    exact: true
  });
  const openStreetMapOption = basemapSelector.getByRole('option', {
    name: 'OpenStreetMap',
    exact: true
  });

  await expect.poll(async () => {
    return await cartoLightOption.evaluate((element) => (element as HTMLOptionElement).selected);
  }).toBe(true);

  await basemapSelector.selectOption({ label: 'OpenStreetMap' });

  await expect.poll(async () => {
    return await openStreetMapOption.evaluate((element) => (element as HTMLOptionElement).selected);
  }).toBe(true);

  await expect.poll(async () => {
    return await cartoLightOption.evaluate((element) => (element as HTMLOptionElement).selected);
  }).toBe(false);
});
