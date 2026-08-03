// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('networkidle');

  const openStreetMapRadio = page.getByRole('radio', { name: 'OpenStreetMap', exact: true });
  const cartoLightRadio = page.getByRole('radio', { name: 'Carto Light', exact: true });

  if (!(await openStreetMapRadio.isVisible())) {
    const baseMapTab = page.getByRole('tab', { name: /^base ?maps?$/i });
    const baseMapButton = page.getByRole('button', { name: /^base ?maps?$/i });

    if ((await baseMapTab.count()) > 0) {
      const selected = await baseMapTab.first().getAttribute('aria-selected');
      if (selected !== 'true') {
        await baseMapTab.first().click();
      }
    } else {
      await expect(baseMapButton.first()).toBeVisible();
      const expanded = await baseMapButton.first().getAttribute('aria-expanded');
      if (expanded !== 'true') {
        await baseMapButton.first().click();
      }
    }
  }

  await expect(openStreetMapRadio).toBeVisible();
  await expect(cartoLightRadio).toBeVisible();

  await expect(cartoLightRadio).toBeChecked();
  await expect(openStreetMapRadio).not.toBeChecked();

  await openStreetMapRadio.click({ force: true });

  await expect(openStreetMapRadio).toBeChecked();
  await expect(cartoLightRadio).not.toBeChecked();
});
