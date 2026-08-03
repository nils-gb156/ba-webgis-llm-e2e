// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle } from "../../../map-model-helpers";

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  await expect(page.getByTestId('map-container')).toBeVisible();
  const layerSwitcher = page.getByTestId('layer-switcher');
  await expect(layerSwitcher).toBeVisible();

  await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');

  const basemapCombobox = layerSwitcher.getByRole('combobox').first();

  if ((await basemapCombobox.count()) > 0) {
    await expect(basemapCombobox).toBeVisible();
    const tagName = await basemapCombobox.evaluate((element) => element.tagName.toLowerCase());

    if (tagName === 'select') {
      await basemapCombobox.selectOption({ label: 'OpenStreetMap' });

      await expect.poll(() =>
        basemapCombobox.evaluate((element) => {
          const select = element as HTMLSelectElement;
          return select.selectedOptions[0]?.textContent?.trim();
        })
      ).toBe('OpenStreetMap');

      await expect.poll(() =>
        basemapCombobox.evaluate((element) => {
          const select = element as HTMLSelectElement;
          return select.selectedOptions[0]?.textContent?.trim() === 'Carto Light';
        })
      ).toBe(false);
    } else {
      await basemapCombobox.click();

      const openStreetMapOption = page.getByRole('option', { name: 'OpenStreetMap', exact: true });
      await expect(openStreetMapOption).toBeVisible();
      await openStreetMapOption.click();

      await expect.poll(async () => (await basemapCombobox.textContent()) ?? '').toMatch(/OpenStreetMap/);
      await expect.poll(async () => (await basemapCombobox.textContent()) ?? '').not.toMatch(/Carto Light/);
    }
  } else {
    const basemapButton = layerSwitcher.getByRole('button', { name: 'Carto Light', exact: true });
    await expect(basemapButton).toBeVisible();
    await basemapButton.click();

    let openStreetMapOption = page.getByRole('option', { name: 'OpenStreetMap', exact: true });
    if ((await openStreetMapOption.count()) === 0) {
      openStreetMapOption = page.getByRole('menuitemradio', { name: 'OpenStreetMap', exact: true });
    }
    if ((await openStreetMapOption.count()) === 0) {
      openStreetMapOption = page.getByRole('radio', { name: 'OpenStreetMap', exact: true });
    }
    if ((await openStreetMapOption.count()) === 0) {
      openStreetMapOption = page.getByRole('button', { name: 'OpenStreetMap', exact: true });
    }

    await expect(openStreetMapOption.first()).toBeVisible();
    await openStreetMapOption.first().click();

    await expect(layerSwitcher.getByRole('button', { name: 'OpenStreetMap', exact: true })).toBeVisible();
    await expect(layerSwitcher.getByRole('button', { name: 'Carto Light', exact: true })).toHaveCount(0);
  }

  await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('OpenStreetMap');
  await expect.poll(() => getActiveBaseLayerTitle(page)).not.toBe('Carto Light');
});
