// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('networkidle');

  const baseMapSelectorToggle = page.getByRole('button', { name: /(base\s*maps?|basemaps?)/i }).first();
  if (await baseMapSelectorToggle.count()) {
    await expect(baseMapSelectorToggle).toBeVisible();

    const ariaExpanded = await baseMapSelectorToggle.getAttribute('aria-expanded');
    const ariaPressed = await baseMapSelectorToggle.getAttribute('aria-pressed');

    if (ariaExpanded === 'false' || ariaPressed === 'false') {
      await baseMapSelectorToggle.click();
    }
  }

  const cartoLightRadio = page.getByRole('radio', { name: 'Carto Light', exact: true });
  const openStreetMapRadio = page.getByRole('radio', { name: 'OpenStreetMap', exact: true });

  await expect(cartoLightRadio).toBeChecked();
  await expect(openStreetMapRadio).not.toBeChecked();

  await openStreetMapRadio.click({ force: true });

  await expect(openStreetMapRadio).toBeChecked();
  await expect(cartoLightRadio).not.toBeChecked();
});
