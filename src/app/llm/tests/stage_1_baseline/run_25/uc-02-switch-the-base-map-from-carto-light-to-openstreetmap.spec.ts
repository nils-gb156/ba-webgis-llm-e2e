// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('networkidle');

  const baseMapSelectorCandidates = [
    page.getByRole('button', { name: 'Base maps', exact: true }),
    page.getByRole('button', { name: 'Basemaps', exact: true }),
    page.getByRole('button', { name: 'Base map', exact: true }),
    page.getByRole('button', { name: 'Basemap', exact: true }),
    page.getByRole('tab', { name: 'Base maps', exact: true }),
    page.getByRole('tab', { name: 'Basemaps', exact: true }),
    page.getByRole('tab', { name: 'Base map', exact: true }),
    page.getByRole('tab', { name: 'Basemap', exact: true })
  ];

  for (const candidate of baseMapSelectorCandidates) {
    if ((await candidate.count()) > 0) {
      const selector = candidate.first();
      await expect(selector).toBeVisible();

      const expanded = await selector.getAttribute('aria-expanded');
      const selected = await selector.getAttribute('aria-selected');
      const pressed = await selector.getAttribute('aria-pressed');

      if (expanded === 'false' || selected === 'false' || pressed === 'false') {
        await selector.click();
      }
      break;
    }
  }

  const cartoLightRadio = page.getByRole('radio', { name: 'Carto Light', exact: true });
  const openStreetMapRadio = page.getByRole('radio', { name: 'OpenStreetMap', exact: true });

  await expect(cartoLightRadio).toBeAttached();
  await expect(openStreetMapRadio).toBeAttached();

  await expect(cartoLightRadio).toBeChecked();

  await openStreetMapRadio.click({ force: true });

  await expect(openStreetMapRadio).toBeChecked();
  await expect(cartoLightRadio).not.toBeChecked();
});
