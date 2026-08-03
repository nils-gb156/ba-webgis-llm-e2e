// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('domcontentloaded');

  const cartoLightRadio = page.getByRole('radio', { name: 'Carto Light', exact: true });
  const openStreetMapRadio = page.getByRole('radio', { name: 'OpenStreetMap', exact: true });

  if (!(await cartoLightRadio.isVisible()) || !(await openStreetMapRadio.isVisible())) {
    const baseMapSelectorNames = [
      'Base map',
      'Base maps',
      'Basemap',
      'Basemaps',
      'Background map',
      'Background maps',
      'Basiskarte',
      'Basiskarten',
      'Grundkarte',
      'Grundkarten',
      'Hintergrundkarte',
      'Hintergrundkarten'
    ];

    for (const name of baseMapSelectorNames) {
      const selectorToggle = page.getByRole('button', { name, exact: true });
      if (await selectorToggle.count()) {
        await selectorToggle.click();
        if ((await cartoLightRadio.isVisible()) && (await openStreetMapRadio.isVisible())) {
          break;
        }
      }
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
