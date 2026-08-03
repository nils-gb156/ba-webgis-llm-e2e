// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const layerSwitcher = page.getByTestId('layer-switcher');
  const layerSwitcherToggle = page.getByTestId('layer-switcher-toggle');

  if (!(await layerSwitcher.isVisible())) {
    if ((await layerSwitcherToggle.getAttribute('aria-pressed')) !== 'true') {
      await layerSwitcherToggle.click();
    }
  }

  await expect(layerSwitcher).toBeVisible();

  const basemapSelector = layerSwitcher.getByRole('combobox', { name: 'Basemaps', exact: true });
  await expect(basemapSelector).toBeVisible();

  const getSelectedBasemapLabel = async () =>
    await basemapSelector.evaluate((element) => {
      if (element instanceof HTMLSelectElement) {
        return element.selectedOptions[0]?.textContent?.trim() ?? '';
      }
      return (element as HTMLInputElement).value?.trim() ?? '';
    });

  await expect.poll(getSelectedBasemapLabel).toBe('Carto Light');

  await basemapSelector.click();
  await basemapSelector.selectOption({ label: 'OpenStreetMap' });

  await expect.poll(getSelectedBasemapLabel).toBe('OpenStreetMap');
  await expect.poll(getSelectedBasemapLabel).not.toBe('Carto Light');
});
