// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('networkidle');

  const cartoLightRadio = page.getByRole('radio', { name: 'Carto Light', exact: true });
  const openStreetMapRadio = page.getByRole('radio', { name: 'OpenStreetMap', exact: true });

  const basemapOptionsVisible =
    (await cartoLightRadio.isVisible().catch(() => false)) &&
    (await openStreetMapRadio.isVisible().catch(() => false));

  if (!basemapOptionsVisible) {
    const basemapToggle = page.getByRole('button', { name: /base ?maps?/i }).first();
    if ((await basemapToggle.count()) > 0) {
      await expect(basemapToggle).toBeVisible();
      const expanded = await basemapToggle.getAttribute('aria-expanded');
      if (expanded !== 'true') {
        await basemapToggle.click();
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
