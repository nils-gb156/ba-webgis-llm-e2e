// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const cartoLightRadio = page.getByRole('radio', { name: 'Carto Light', exact: true });
  const openStreetMapRadio = page.getByRole('radio', { name: 'OpenStreetMap', exact: true });

  if (!(await cartoLightRadio.isVisible()) || !(await openStreetMapRadio.isVisible())) {
    const baseMapSelectorCandidates = [
      page.getByRole('button', { name: 'Base map', exact: true, expanded: false }),
      page.getByRole('button', { name: 'Base maps', exact: true, expanded: false }),
      page.getByRole('button', { name: 'Basemap', exact: true, expanded: false }),
      page.getByRole('button', { name: 'Basemaps', exact: true, expanded: false }),
      page.getByRole('button', { name: 'Base map', exact: true }),
      page.getByRole('button', { name: 'Base maps', exact: true }),
      page.getByRole('button', { name: 'Basemap', exact: true }),
      page.getByRole('button', { name: 'Basemaps', exact: true }),
      page.getByRole('tab', { name: 'Base map', exact: true }),
      page.getByRole('tab', { name: 'Base maps', exact: true }),
      page.getByRole('tab', { name: 'Basemap', exact: true }),
      page.getByRole('tab', { name: 'Basemaps', exact: true }),
      page.getByRole('button', { name: /base maps?/i }),
      page.getByRole('button', { name: /basemaps?/i }),
      page.getByRole('tab', { name: /base maps?/i }),
      page.getByRole('tab', { name: /basemaps?/i })
    ];

    for (const candidate of baseMapSelectorCandidates) {
      if ((await candidate.count()) > 0 && (await candidate.first().isVisible())) {
        const expanded = await candidate.first().getAttribute('aria-expanded');
        if (expanded !== 'true') {
          await candidate.first().click();
        }
        break;
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
