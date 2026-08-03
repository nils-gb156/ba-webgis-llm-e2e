// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const cartoLightRadio = page.getByRole('radio', { name: 'Carto Light', exact: true });
  const openStreetMapRadio = page.getByRole('radio', { name: 'OpenStreetMap', exact: true });
  const baseMapButton = page.getByRole('button', { name: /base\s*map|basemap/i }).first();
  const baseMapTab = page.getByRole('tab', { name: /base\s*map|basemap/i }).first();

  const selectorVisible =
    (await cartoLightRadio.isVisible()) || (await openStreetMapRadio.isVisible());

  if (!selectorVisible) {
    if (await baseMapButton.isVisible()) {
      await expect(baseMapButton).toBeVisible();
      await baseMapButton.click();
    } else {
      await expect(baseMapTab).toBeVisible();
      await baseMapTab.click();
    }
  }

  await expect(cartoLightRadio).toBeVisible();
  await expect(openStreetMapRadio).toBeVisible();

  await expect(cartoLightRadio).toBeChecked();
  await expect(openStreetMapRadio).not.toBeChecked();

  await openStreetMapRadio.click({ force: true });

  await expect(openStreetMapRadio).toBeChecked();
  await expect(cartoLightRadio).not.toBeChecked();
});
