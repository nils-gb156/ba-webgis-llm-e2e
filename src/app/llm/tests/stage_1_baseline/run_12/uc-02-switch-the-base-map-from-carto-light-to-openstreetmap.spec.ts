// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('domcontentloaded');

  const cartoLightRadio = page.getByRole('radio', { name: 'Carto Light', exact: true });
  const openStreetMapRadio = page.getByRole('radio', { name: 'OpenStreetMap', exact: true });
  const baseMapSelectorToggle = page.getByRole('button', {
    name: /^(Base map|Base maps|Basemap|Basemaps|Background map|Background maps|Grundkarte|Grundkarten|Basiskarte|Basiskarten)$/i
  });

  const radiosVisible = (await cartoLightRadio.isVisible()) && (await openStreetMapRadio.isVisible());

  if (!radiosVisible) {
    await expect(baseMapSelectorToggle).toBeVisible();
    const expanded = await baseMapSelectorToggle.getAttribute('aria-expanded');
    if (expanded !== 'true') {
      await baseMapSelectorToggle.click();
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
