// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle } from '../../../../map-model-helpers';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const layerSwitcher = page.getByTestId('layer-switcher');
  const basemapSelector = page.getByRole('combobox', { name: 'Basemaps', exact: true });

  const getBasemapSelectionFromUi = async () =>
    await basemapSelector.evaluate((element) => {
      const el = element as HTMLElement & {
        value?: string;
        selectedOptions?: ArrayLike<HTMLOptionElement>;
      };

      if (el.selectedOptions && el.selectedOptions.length > 0) {
        const selected = el.selectedOptions[0];
        return selected?.label ?? selected?.text ?? '';
      }

      if (typeof el.value === 'string' && el.value.trim().length > 0) {
        return el.value.trim();
      }

      return element.textContent?.trim() ?? '';
    });

  await expect(layerSwitcher).toBeVisible();
  await expect(basemapSelector).toBeVisible();

  await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
  await expect.poll(getBasemapSelectionFromUi).toBe('Carto Light');

  const basemapSelectorTagName = await basemapSelector.evaluate((element) => element.tagName);

  if (basemapSelectorTagName === 'SELECT') {
    await basemapSelector.selectOption({ label: 'OpenStreetMap' });
  } else {
    await basemapSelector.click();
    await page.getByRole('option', { name: 'OpenStreetMap', exact: true }).click();
  }

  await expect.poll(getBasemapSelectionFromUi).toBe('OpenStreetMap');
  await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('OpenStreetMap');

  await expect.poll(getBasemapSelectionFromUi).not.toBe('Carto Light');
  await expect.poll(() => getActiveBaseLayerTitle(page)).not.toBe('Carto Light');
});
