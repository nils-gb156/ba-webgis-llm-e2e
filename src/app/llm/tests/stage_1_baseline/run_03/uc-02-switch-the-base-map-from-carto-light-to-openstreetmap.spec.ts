// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const baseMapSelectorToggleCandidates = page.getByRole('button', {
    name: /base ?maps?|background ?maps?|basemaps?/i
  });

  if ((await baseMapSelectorToggleCandidates.count()) > 0) {
    const baseMapSelectorToggle = baseMapSelectorToggleCandidates.first();
    if ((await baseMapSelectorToggle.getAttribute('aria-expanded')) !== 'true') {
      await baseMapSelectorToggle.click();
    }
  }

  const cartoLightRadio = page.getByRole('radio', { name: 'Carto Light', exact: true });
  const openStreetMapRadio = page.getByRole('radio', { name: 'OpenStreetMap', exact: true });

  if ((await cartoLightRadio.count()) === 0 || (await openStreetMapRadio.count()) === 0) {
    const currentBaseMapButton = page.getByRole('button', { name: 'Carto Light', exact: true });
    if ((await currentBaseMapButton.count()) > 0) {
      await currentBaseMapButton.click();
    }
  }

  await expect(cartoLightRadio).toBeAttached();
  await expect(openStreetMapRadio).toBeAttached();

  await expect(cartoLightRadio).toBeChecked();
  await expect(openStreetMapRadio).not.toBeChecked();

  await openStreetMapRadio.click({ force: true });

  await expect(openStreetMapRadio).toBeChecked();
  await expect(cartoLightRadio).not.toBeChecked();
});
