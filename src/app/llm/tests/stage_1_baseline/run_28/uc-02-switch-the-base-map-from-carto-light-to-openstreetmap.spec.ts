// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('domcontentloaded');

  const cartoLightRadio = page.getByRole('radio', { name: 'Carto Light', exact: true });
  const openStreetMapRadio = page.getByRole('radio', { name: 'OpenStreetMap', exact: true });
  const baseMapSelectorButton = page.getByRole('button', {
    name: /^(Base maps|Basemaps|Base map|Basemap|Background maps|Background map)$/i
  });

  if (!(await cartoLightRadio.isVisible()) || !(await openStreetMapRadio.isVisible())) {
    await expect(baseMapSelectorButton).toBeVisible();
    const expanded = await baseMapSelectorButton.getAttribute('aria-expanded');
    if (expanded !== 'true') {
      await baseMapSelectorButton.click();
    }
  }

  await expect(cartoLightRadio).toBeVisible();
  await expect(openStreetMapRadio).toBeVisible();

  await expect(cartoLightRadio).toBeChecked();

  if (!(await openStreetMapRadio.isChecked())) {
    await openStreetMapRadio.click({ force: true });
  }

  await expect(openStreetMapRadio).toBeChecked();
  await expect(cartoLightRadio).not.toBeChecked();
});
