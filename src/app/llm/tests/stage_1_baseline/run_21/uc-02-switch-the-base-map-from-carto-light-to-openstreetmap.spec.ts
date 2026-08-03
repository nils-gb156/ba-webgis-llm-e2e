// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('domcontentloaded');

  const baseMapSelectorButton = page.getByRole('button', { name: /base maps?/i }).first();
  const cartoLightLabel = page.getByText('Carto Light', { exact: true });
  const openStreetMapLabel = page.getByText('OpenStreetMap', { exact: true });
  const cartoLightRadio = page.getByRole('radio', { name: 'Carto Light', exact: true });
  const openStreetMapRadio = page.getByRole('radio', { name: 'OpenStreetMap', exact: true });

  let selectorButtonVisible = false;
  try {
    await expect(baseMapSelectorButton).toBeVisible({ timeout: 3000 });
    selectorButtonVisible = true;
  } catch {
    selectorButtonVisible = false;
  }

  if (selectorButtonVisible) {
    const expanded = await baseMapSelectorButton.getAttribute('aria-expanded');
    if (expanded !== 'true') {
      await baseMapSelectorButton.click();
    }
  }

  await expect(cartoLightLabel).toBeVisible();
  await expect(openStreetMapLabel).toBeVisible();

  await expect(cartoLightRadio).toBeChecked();
  await expect(openStreetMapRadio).not.toBeChecked();

  await openStreetMapRadio.click({ force: true });

  await expect(openStreetMapRadio).toBeChecked();
  await expect(cartoLightRadio).not.toBeChecked();
});
