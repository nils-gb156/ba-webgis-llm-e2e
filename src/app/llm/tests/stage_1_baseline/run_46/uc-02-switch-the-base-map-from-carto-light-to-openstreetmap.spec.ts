// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const baseMapToggleButton = page.getByRole('button', { name: /base ?maps?/i }).first();
  const baseMapToggleTab = page.getByRole('tab', { name: /base ?maps?/i }).first();

  let baseMapToggle = baseMapToggleButton;
  if ((await baseMapToggleButton.count()) === 0 || !(await baseMapToggleButton.isVisible())) {
    baseMapToggle = baseMapToggleTab;
  }

  await expect(baseMapToggle).toBeVisible();

  const cartoLightLabel = page.getByText('Carto Light', { exact: true });
  const osmLabel = page.getByText('OpenStreetMap', { exact: true });

  if (!(await cartoLightLabel.isVisible()) || !(await osmLabel.isVisible())) {
    await baseMapToggle.click();
  }

  await expect(cartoLightLabel).toBeVisible();
  await expect(osmLabel).toBeVisible();

  const cartoLightRadio = page.getByRole('radio', { name: 'Carto Light', exact: true });
  const osmRadio = page.getByRole('radio', { name: 'OpenStreetMap', exact: true });

  await expect(cartoLightRadio).toBeChecked();
  await expect(osmRadio).not.toBeChecked();

  await osmRadio.click({ force: true });

  await expect(osmRadio).toBeChecked();
  await expect(cartoLightRadio).not.toBeChecked();
});
