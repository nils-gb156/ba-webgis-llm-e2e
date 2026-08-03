// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle } from '../../../map-model-helpers';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const layerSwitcher = page.getByTestId('layer-switcher');
  await expect(layerSwitcher).toBeVisible();

  await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');

  const basemapComboboxes = layerSwitcher.getByRole('combobox');
  if ((await basemapComboboxes.count()) > 0) {
    const basemapCombobox = basemapComboboxes.first();
    await expect(basemapCombobox).toBeVisible();

    const tagName = await basemapCombobox.evaluate((element) => element.tagName);
    if (tagName === 'SELECT') {
      await basemapCombobox.selectOption({ label: 'OpenStreetMap' });
    } else {
      await basemapCombobox.click();

      let osmOption = page.getByRole('option', { name: 'OpenStreetMap', exact: true });
      if ((await osmOption.count()) === 0) {
        osmOption = page.getByRole('menuitemradio', { name: 'OpenStreetMap', exact: true });
      }
      if ((await osmOption.count()) === 0) {
        osmOption = page.getByRole('button', { name: 'OpenStreetMap', exact: true });
      }
      if ((await osmOption.count()) === 0) {
        osmOption = page.getByText('OpenStreetMap', { exact: true });
      }

      await expect(osmOption.first()).toBeVisible();
      await osmOption.first().click();
    }
  } else {
    let basemapSelectorButton = layerSwitcher.getByRole('button', { name: /Carto Light/i });
    if ((await basemapSelectorButton.count()) === 0) {
      basemapSelectorButton = layerSwitcher.getByRole('button').first();
    }

    await expect(basemapSelectorButton.first()).toBeVisible();
    await basemapSelectorButton.first().click();

    let osmOption = page.getByRole('option', { name: 'OpenStreetMap', exact: true });
    if ((await osmOption.count()) === 0) {
      osmOption = page.getByRole('menuitemradio', { name: 'OpenStreetMap', exact: true });
    }
    if ((await osmOption.count()) === 0) {
      osmOption = page.getByRole('button', { name: 'OpenStreetMap', exact: true });
    }
    if ((await osmOption.count()) === 0) {
      osmOption = page.getByText('OpenStreetMap', { exact: true });
    }

    await expect(osmOption.first()).toBeVisible();
    await osmOption.first().click();
  }

  await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('OpenStreetMap');
  await expect.poll(() => getActiveBaseLayerTitle(page)).not.toBe('Carto Light');
});
