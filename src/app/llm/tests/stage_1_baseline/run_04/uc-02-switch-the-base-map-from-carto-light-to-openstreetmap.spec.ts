// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const cartoLightLabel = page.getByText('Carto Light', { exact: true });
  const openStreetMapLabel = page.getByText('OpenStreetMap', { exact: true });

  if (!(await cartoLightLabel.isVisible()) || !(await openStreetMapLabel.isVisible())) {
    const baseMapToggle = page.getByRole('button', { name: /base\s*maps?/i }).first();
    await expect(baseMapToggle).toBeVisible();
    await baseMapToggle.click();
  }

  await expect(cartoLightLabel).toBeVisible();
  await expect(openStreetMapLabel).toBeVisible();

  const cartoLightRadio = page.getByRole('radio', { name: 'Carto Light', exact: true });
  const openStreetMapRadio = page.getByRole('radio', { name: 'OpenStreetMap', exact: true });

  await expect(cartoLightRadio).toBeAttached();
  await expect(openStreetMapRadio).toBeAttached();

  await expect(cartoLightRadio).toBeChecked();
  await expect(openStreetMapRadio).not.toBeChecked();

  await openStreetMapRadio.click({ force: true });

  await expect(openStreetMapRadio).toBeChecked();
  await expect(cartoLightRadio).not.toBeChecked();
});
