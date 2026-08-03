// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const cartoLightRadio = page.getByRole('radio', { name: 'Carto Light', exact: true });
  const openStreetMapRadio = page.getByRole('radio', { name: 'OpenStreetMap', exact: true });

  if (!(await cartoLightRadio.isVisible()) || !(await openStreetMapRadio.isVisible())) {
    const baseMapSelectorToggle = page
      .getByRole('button', { name: /base\s*maps?|basemaps?|background\s*maps?/i })
      .first();

    await expect(baseMapSelectorToggle).toBeVisible();

    const isExpanded = await baseMapSelectorToggle.getAttribute('aria-expanded');
    if (isExpanded !== 'true') {
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
