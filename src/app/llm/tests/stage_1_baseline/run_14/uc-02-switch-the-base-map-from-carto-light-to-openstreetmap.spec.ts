// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const cartoLightRadio = page.getByRole('radio', { name: 'Carto Light', exact: true });
  const openStreetMapRadio = page.getByRole('radio', { name: 'OpenStreetMap', exact: true });

  if ((await cartoLightRadio.count()) === 0 || (await openStreetMapRadio.count()) === 0) {
    const toggleNamePatterns = [/^Base maps?$/i, /^Basemaps?$/i, /^Background maps?$/i, /^Basiskarten$/i];
    let selectorOpened = false;

    for (const name of toggleNamePatterns) {
      const toggle = page.getByRole('button', { name }).first();

      if ((await toggle.count()) > 0) {
        await expect(toggle).toBeVisible();

        const expanded = await toggle.getAttribute('aria-expanded');
        if (expanded !== 'true') {
          await toggle.click();
        }

        selectorOpened = true;
        break;
      }
    }

    expect(selectorOpened).toBeTruthy();
  }

  await expect(cartoLightRadio).toBeChecked();
  await expect(openStreetMapRadio).not.toBeChecked();

  await openStreetMapRadio.click({ force: true });

  await expect(openStreetMapRadio).toBeChecked();
  await expect(cartoLightRadio).not.toBeChecked();
});
