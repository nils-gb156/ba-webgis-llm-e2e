// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  await expect(page.getByTestId('map-container')).toBeVisible();

  const layerSwitcher = page.getByTestId('layer-switcher');
  const layerSwitcherToggle = page.getByTestId('layer-switcher-toggle');
  await expect(layerSwitcher).toBeVisible();
  await expect(layerSwitcherToggle).toHaveAttribute('aria-pressed', 'true');

  const basemapSelector = layerSwitcher.getByRole('combobox', { name: 'Basemaps', exact: true });
  await expect(basemapSelector).toBeVisible();

  await expect.poll(async () => {
    return await basemapSelector.evaluate((element) => {
      const select = element as HTMLSelectElement;
      return select.selectedOptions[0]?.textContent?.trim();
    });
  }).toBe('Carto Light');

  await basemapSelector.click();
  await basemapSelector.selectOption({ label: 'OpenStreetMap' });

  await expect.poll(async () => {
    return await basemapSelector.evaluate((element) => {
      const select = element as HTMLSelectElement;
      return select.selectedOptions[0]?.textContent?.trim();
    });
  }).toBe('OpenStreetMap');

  await expect.poll(async () => {
    return await basemapSelector.evaluate((element) => {
      const select = element as HTMLSelectElement;
      return Array.from(select.options).find((option) => option.textContent?.trim() === 'Carto Light')?.selected ?? false;
    });
  }).toBe(false);
});
